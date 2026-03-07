import { db, asNonEmptyBatch } from "$/server/db";
import type { BatchQuery } from "$/server/db";
import { payment, billingInfo, subMeter } from "$/server/db/schema";
import { createBillingInfoLogic } from "$/server/crud/billing-info-crud";

import type { NewPayment } from "$/types/payment";
import type { NewBillingInfo } from "$/types/billing-info";
import type { BillingInfo, NewSubMeter } from "$/types/sub-meter";

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
 * - Inserts payments first, then billingInfos, then subMeters using a single batch.
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
    const database = db();
    const paymentIdsPlanned = new Set<string>();
    const billingInfoIdsPlanned = new Set<string>();
    const subMeterIdsPlanned = new Set<string>();

    const paymentCandidates: NewPayment[] = [];
    const billingInfoCandidates: NewBillingInfo[] = [];
    const subMeterCandidates: NewSubMeter[] = [];

    // PAYMENTS
    if (Array.isArray(rawPayments) && rawPayments.length > 0) {
      const toInsert = rawPayments.map(normalizePayment);

      for (const item of toInsert) {
        if (item.id) {
          if (paymentIdsPlanned.has(item.id as string)) {
            report.payments.skipped.push({
              item,
              reason: `payment id ${item.id} already queued`,
            });
            continue;
          }
          const exists = await database.query.payment.findFirst({
            where: { id: item.id as string },
          });
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

        const id = (item.id as string | undefined) ?? crypto.randomUUID();
        const candidate: NewPayment = {
          ...(item as NewPayment),
          id,
          date: item.date ?? new Date(),
        };

        paymentIdsPlanned.add(id);
        paymentCandidates.push(candidate);
      }
    }

    // BILLING INFOS
    if (Array.isArray(rawBillingInfos) && rawBillingInfos.length > 0) {
      const toInsert = rawBillingInfos.map(normalizeBillingInfo);

      for (const item of toInsert) {
        const missingRefs: string[] = [];

        if (!item.userId) {
          missingRefs.push("userId");
        } else {
          const u = await database.query.user.findFirst({
            where: { id: item.userId as string },
          });
          if (!u) missingRefs.push(`user ${item.userId}`);
        }

        if (!item.paymentId) {
          missingRefs.push("paymentId");
        } else if (!paymentIdsPlanned.has(item.paymentId as string)) {
          const p = await database.query.payment.findFirst({
            where: { id: item.paymentId as string },
          });
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
          if (billingInfoIdsPlanned.has(item.id as string)) {
            report.billingInfos.skipped.push({
              item,
              reason: `billingInfo id ${item.id} already queued`,
            });
            continue;
          }
          const exists = await database.query.billingInfo.findFirst({
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

        const id = (item.id as string | undefined) ?? crypto.randomUUID();
        const candidate: NewBillingInfo = {
          ...(item as NewBillingInfo),
          id,
          date: item.date ?? new Date(),
        };

        billingInfoIdsPlanned.add(id);
        billingInfoCandidates.push(candidate);
      }
    }

    // SUB METERS
    if (Array.isArray(rawSubMeters) && rawSubMeters.length > 0) {
      const toInsert = rawSubMeters.map(normalizeSubMeter);

      for (const item of toInsert) {
        const missingRefs: string[] = [];

        if (!item.billingInfoId) {
          missingRefs.push("billingInfoId");
        } else if (!billingInfoIdsPlanned.has(item.billingInfoId as string)) {
          const b = await database.query.billingInfo.findFirst({
            where: { id: item.billingInfoId as string },
          });
          if (!b) missingRefs.push(`billingInfo ${item.billingInfoId}`);
        }

        if (!item.paymentId) {
          missingRefs.push("paymentId");
        } else if (!paymentIdsPlanned.has(item.paymentId as string)) {
          const p = await database.query.payment.findFirst({
            where: { id: item.paymentId as string },
          });
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
          if (subMeterIdsPlanned.has(item.id as string)) {
            report.subMeters.skipped.push({
              item,
              reason: `subMeter id ${item.id} already queued`,
            });
            continue;
          }
          const exists = await database.query.subMeter.findFirst({
            where: { id: item.id as string },
          });
          if (exists) {
            report.subMeters.skipped.push({
              item,
              reason: `subMeter id ${item.id} already exists`,
            });
            continue;
          }
        }

        const id = (item.id as string | undefined) ?? crypto.randomUUID();
        const candidate: NewSubMeter = {
          ...(item as NewSubMeter),
          id,
        };

        subMeterIdsPlanned.add(id);
        subMeterCandidates.push(candidate);
      }
    }

    const batchQueries: BatchQuery[] = [];
    let paymentsResultIndex: number | null = null;
    let billingInfosResultIndex: number | null = null;
    let subMetersResultIndex: number | null = null;

    if (paymentCandidates.length > 0) {
      paymentsResultIndex = batchQueries.length;
      batchQueries.push(database.insert(payment).values(paymentCandidates).returning());
    }
    if (billingInfoCandidates.length > 0) {
      billingInfosResultIndex = batchQueries.length;
      batchQueries.push(database.insert(billingInfo).values(billingInfoCandidates).returning());
    }
    if (subMeterCandidates.length > 0) {
      subMetersResultIndex = batchQueries.length;
      batchQueries.push(database.insert(subMeter).values(subMeterCandidates).returning());
    }

    let batchResults: Awaited<ReturnType<ReturnType<typeof db>["batch"]>> = [];
    const batchPayload = asNonEmptyBatch(batchQueries);
    if (batchPayload) {
      batchResults = await database.batch(batchPayload);
    }

    const paymentResults =
      paymentsResultIndex !== null && Array.isArray(batchResults[paymentsResultIndex])
        ? (batchResults[paymentsResultIndex] as NewPayment[])
        : paymentCandidates;
    const billingInfoResults =
      billingInfosResultIndex !== null && Array.isArray(batchResults[billingInfosResultIndex])
        ? (batchResults[billingInfosResultIndex] as NewBillingInfo[])
        : billingInfoCandidates;
    const subMeterResults =
      subMetersResultIndex !== null && Array.isArray(batchResults[subMetersResultIndex])
        ? (batchResults[subMetersResultIndex] as NewSubMeter[])
        : subMeterCandidates;

    report.payments.added.push(...paymentResults);
    report.billingInfos.added.push(...billingInfoResults);
    report.subMeters.added.push(...subMeterResults);

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
      message: "Import failed",
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
 */
export async function importBillingHandler(
  items: Parameters<typeof createBillingInfoLogic>[0][],
  userId: string
): Promise<BillingInfo[]> {
  const created: BillingInfo[] = [];

  // Process billing items chronologically (oldest first). If items are
  // supplied out-of-order (e.g. newest first) sub-meter usage calculations
  // can become negative because a newer reading would be inserted before
  // an older one. Sorting here ensures proper baseline readings are present.
  const sortedItems = [...items].sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    const na = Number.isFinite(ta) ? ta : 0;
    const nb = Number.isFinite(tb) ? tb : 0;
    return na - nb;
  });

  for (const item of sortedItems) {
    const ci = await createBillingInfoLogic(item, userId);
    created.push(ci);
  }

  return created;
}
