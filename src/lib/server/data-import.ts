import { db } from "$/server/db";
import { addPayment } from "$/server/crud/payment-crud";
import { addBillingInfo, createBillingInfoLogic } from "$/server/crud/billing-info-crud";
import { addSubMeter } from "$/server/crud/sub-meter-crud";

import type { NewPayment } from "$/types/payment";
import type { NewBillingInfo } from "$/types/billing-info";
import type { BillingInfo, NewSubMeter } from "$/types/sub-meter";
import type { HelperParamOptions } from "./types/helper";

type AnyRecord = Record<string, unknown>;

type CollectionResult<T> = {
  added: T[];
  skipped: { item: AnyRecord; reason: string }[];
  errors: { item: AnyRecord; error: string }[];
};

export type ImportPayload = {
  payments?: Partial<NewPayment>[];
  billingInfos?: Partial<NewBillingInfo>[];
  subMeters?: Partial<NewSubMeter>[];
  // Accept snake_case / camelCase variants as well
  [key: string]: unknown;
};

export type ImportResult = {
  success: boolean;
  report: {
    payments: CollectionResult<NewPayment>;
    billingInfos: CollectionResult<NewBillingInfo>;
    subMeters: CollectionResult<NewSubMeter>;
  };
  message?: string;
  error?: string;
};

const makeEmptyResult = <T>(): CollectionResult<T> => ({
  added: [],
  skipped: [],
  errors: [],
});

function isObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return null;
    return d;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extractArrays(payload: ImportPayload) {
  const getArray = (keys: string[]) => {
    for (const k of keys) {
      const v = payload[k];
      if (Array.isArray(v)) return v as AnyRecord[];
    }
    return undefined;
  };

  return {
    payments: getArray(["payments", "payment"]),
    billingInfos: getArray(["billingInfos", "billing_infos", "billingInfo", "billing_info"]),
    subMeters: getArray(["subMeters", "sub_meters", "subMeter", "sub_meter"]),
  };
}

function normalizePayment(item: AnyRecord): Partial<NewPayment> {
  const out: AnyRecord = { ...item };
  if ("date" in out) {
    const d = toDate(out["date"]);
    if (d) out["date"] = d;
  }
  if ("amount" in out) {
    const n = toNumber(out["amount"]);
    if (n !== null) out["amount"] = n;
  }
  return out as Partial<NewPayment>;
}

function normalizeBillingInfo(item: AnyRecord): Partial<NewBillingInfo> {
  const out: AnyRecord = { ...item };
  if ("date" in out) {
    const d = toDate(out["date"]);
    if (d) out["date"] = d;
  }
  if ("totalkWh" in out) {
    const n = toNumber(out["totalkWh"]);
    if (n !== null) out["totalkWh"] = n;
  } else if ("total_kWh" in out) {
    const n = toNumber(out["total_kWh"]);
    if (n !== null) out["totalkWh"] = n;
  }
  if ("balance" in out) {
    const n = toNumber(out["balance"]);
    if (n !== null) out["balance"] = n;
  }
  if ("payPerkWh" in out) {
    const n = toNumber(out["payPerkWh"]);
    if (n !== null) out["payPerkWh"] = n;
  } else if ("pay_per_kWh" in out) {
    const n = toNumber(out["pay_per_kWh"]);
    if (n !== null) out["payPerkWh"] = n;
  }
  return out as Partial<NewBillingInfo>;
}

function normalizeSubMeter(item: AnyRecord): Partial<NewSubMeter> {
  const out: AnyRecord = { ...item };
  if ("subkWh" in out) {
    const n = toNumber(out["subkWh"]);
    if (n !== null) out["subkWh"] = n;
  } else if ("subKwh" in out) {
    const n = toNumber(out["subKwh"]);
    if (n !== null) out["subkWh"] = n;
  } else if ("sub_kWh" in out) {
    const n = toNumber(out["sub_kWh"]);
    if (n !== null) out["subkWh"] = n;
  }
  if ("reading" in out) {
    const n = toNumber(out["reading"]);
    if (n !== null) out["reading"] = n;
  }
  return out as Partial<NewSubMeter>;
}

/**
 * Main import function for billing-related data.
 *
 * Behavior:
 * - Validates & normalizes payload.
 * - Inserts payments first, then billingInfos, then subMeters inside one transaction.
 * - Skips items with existing ids, reports items with missing references in `errors`.
 */
export async function importBillingData(payload: ImportPayload): Promise<ImportResult> {
  const report = {
    payments: makeEmptyResult<NewPayment>(),
    billingInfos: makeEmptyResult<NewBillingInfo>(),
    subMeters: makeEmptyResult<NewSubMeter>(),
  };

  if (!isObject(payload)) {
    return {
      success: false,
      report,
      message: "Payload must be an object",
      error: "Invalid payload type",
    };
  }

  const {
    payments: rawPayments,
    billingInfos: rawBillingInfos,
    subMeters: rawSubMeters,
  } = extractArrays(payload);

  try {
    await db.transaction(async (tx) => {
      // PAYMENTS
      if (Array.isArray(rawPayments) && rawPayments.length > 0) {
        const toInsert = rawPayments.map(normalizePayment);
        const insertCandidates: Partial<NewPayment>[] = [];

        for (const item of toInsert) {
          if (item.id) {
            const exists = await tx.query.payment.findFirst({ where: { id: item.id as string } });
            if (exists) {
              report.payments.skipped.push({
                item,
                reason: `payment id ${item.id} already exists`,
              });
              continue;
            }
          }

          if (item.amount === undefined || item.amount === null) {
            report.payments.errors.push({ item, error: "Payment must include an amount" });
            continue;
          }

          if (!item.date) item.date = new Date();
          insertCandidates.push(item);
        }

        if (insertCandidates.length > 0) {
          const added = await addPayment(insertCandidates as any[], tx);
          if (!added.valid) throw new Error(`Failed to add payments: ${added.message}`);
          report.payments.added.push(...(added.value ?? []));
        }
      }

      // BILLING INFOS
      if (Array.isArray(rawBillingInfos) && rawBillingInfos.length > 0) {
        const toInsert = rawBillingInfos.map(normalizeBillingInfo);
        const insertCandidates: Partial<NewBillingInfo>[] = [];

        for (const item of toInsert) {
          const missingRefs: string[] = [];

          if (!item.userId) {
            missingRefs.push("userId");
          } else {
            const u = await tx.query.user.findFirst({ where: { id: item.userId as string } });
            if (!u) missingRefs.push(`user ${item.userId}`);
          }

          if (!item.paymentId) {
            missingRefs.push("paymentId");
          } else {
            const p = await tx.query.payment.findFirst({ where: { id: item.paymentId as string } });
            if (!p) missingRefs.push(`payment ${item.paymentId}`);
          }

          if (missingRefs.length > 0) {
            report.billingInfos.errors.push({
              item,
              error: `Missing/unknown references: ${missingRefs.join(", ")}`,
            });
            continue;
          }

          if (item.id) {
            const exists = await tx.query.billingInfo.findFirst({
              where: { id: item.id as string },
            });
            if (exists) {
              report.billingInfos.skipped.push({
                item,
                reason: `billingInfo id ${item.id} already exists`,
              });
              continue;
            }
          }

          if (!item.date) item.date = new Date();
          insertCandidates.push(item);
        }

        if (insertCandidates.length > 0) {
          const added = await addBillingInfo(insertCandidates as any[], tx);
          if (!added.valid) throw new Error(`Failed to add billing infos: ${added.message}`);
          report.billingInfos.added.push(...(added.value ?? []));
        }
      }

      // SUB METERS
      if (Array.isArray(rawSubMeters) && rawSubMeters.length > 0) {
        const toInsert = rawSubMeters.map(normalizeSubMeter);
        const insertCandidates: Partial<NewSubMeter>[] = [];

        for (const item of toInsert) {
          const missingRefs: string[] = [];

          if (!item.billingInfoId) {
            missingRefs.push("billingInfoId");
          } else {
            const b = await tx.query.billingInfo.findFirst({
              where: { id: item.billingInfoId as string },
            });
            if (!b) missingRefs.push(`billingInfo ${item.billingInfoId}`);
          }

          if (!item.paymentId) {
            missingRefs.push("paymentId");
          } else {
            const p = await tx.query.payment.findFirst({ where: { id: item.paymentId as string } });
            if (!p) missingRefs.push(`payment ${item.paymentId}`);
          }

          if (missingRefs.length > 0) {
            report.subMeters.errors.push({
              item,
              error: `Missing/unknown references: ${missingRefs.join(", ")}`,
            });
            continue;
          }

          if (item.id) {
            const exists = await tx.query.subMeter.findFirst({ where: { id: item.id as string } });
            if (exists) {
              report.subMeters.skipped.push({
                item,
                reason: `subMeter id ${item.id} already exists`,
              });
              continue;
            }
          }

          insertCandidates.push(item);
        }

        if (insertCandidates.length > 0) {
          const added = await addSubMeter(insertCandidates as any[], tx);
          if (!added.valid) throw new Error(`Failed to add sub meters: ${added.message}`);
          report.subMeters.added.push(...(added.value ?? []));
        }
      }
    }); // end transaction

    return {
      success: true,
      report,
      message: "Import completed",
    };
  } catch (err) {
    let msg: string;
    if (typeof err === "string") {
      msg = err;
    } else if (err instanceof Error && typeof err.message === "string") {
      msg = err.message;
    } else {
      try {
        msg = String(err);
      } catch {
        msg = "Unknown error";
      }
    }
    return {
      success: false,
      report,
      message: "Import failed and transaction rolled back",
      error: msg,
    };
  }
}

/**
 * Lightweight helper used by the UI to summarize a parsed JSON payload:
 * returns counts for each supported collection (0 if absent).
 */
export function summarizeImportPayload(payload: ImportPayload) {
  const { payments, billingInfos, subMeters } = extractArrays(payload);
  return {
    payments: payments ? payments.length : 0,
    billingInfos: billingInfos ? billingInfos.length : 0,
    subMeters: subMeters ? subMeters.length : 0,
  };
}

/**
 * Handler that imports an array of billing form items for a user.
 * - Reuses `createBillingInfoLogic` to ensure consistent behavior.
 * - Runs all creations inside a single transaction when called without `tx`
 *   or uses the passed `tx` if provided (so callers can embed it in a larger transaction).
 */
export async function importBillingHandler(
  items: Parameters<typeof createBillingInfoLogic>[0][],
  userId: string,
  tx?: HelperParamOptions<NewBillingInfo>["tx"]
): Promise<BillingInfo[]> {
  const created: BillingInfo[] = [];

  if (tx) {
    // Already in a transaction provided by caller
    for (const item of items) {
      const ci = await createBillingInfoLogic(item, userId, tx);
      created.push(ci);
    }
    return created;
  }

  // Create a transaction for the whole import
  return await db.transaction(async (txLocal) => {
    for (const item of items) {
      const ci = await createBillingInfoLogic(
        item,
        userId,
        txLocal as HelperParamOptions<NewBillingInfo>["tx"]
      );
      created.push(ci);
    }
    return created;
  });
}
