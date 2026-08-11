import { db, asNonEmptyBatch } from "$/server/db";
import type { BatchQuery } from "$/server/db";
import { and, count, desc, eq, inArray, isNotNull, lt, not, sum, type SQL } from "drizzle-orm";
import { billingInfo, payment, tenantReading } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData, omit } from "$/utils/mapper";
import type {
  NewBillingInfo,
  BillingInfo,
  BillingInfoDTO,
  BillingInfoWithPaymentAndSubMetersWithPayment,
  BillingCreateForm,
  BillingUpdateForm,
  BillingSubMeterForm,
} from "$/types/billing-info";
import type { TenantReadingDTO } from "$/types/tenant-reading";
import type { User } from "$/types/user";
import type { Payment } from "$/types/payment";
import { calculatePayPerKwh } from "$lib";
import { formatEnergy } from "$/utils/format";
import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { getEnergyUnit, type EnergyUnit } from "$/utils/converter/energy";
import { originCheck } from "$/server/auth";
import { generateQueryConditions } from "$/server/mapper";

export type TotalEnergyUsageResult = {
  total: number;
  formatted: string;
  energyUnit: EnergyUnit;
};

export async function getTotalEnergyUsage(): Promise<TotalEnergyUsageResult> {
  const result = await db()
    .select({ total: sum(billingInfo.totalkWh) })
    .from(billingInfo);
  const total = Number(result[0]?.total ?? 0);
  const energyUnit = getEnergyUnit(total);
  return {
    total,
    formatted: formatEnergy(total),
    energyUnit,
  };
}

type BillingInfoQueryOptions = {
  with?: Record<string, unknown>;
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { date: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addBillingInfo(
  data: Omit<NewBillingInfo, "id">[]
): Promise<HelperResult<BillingInfo[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 billing info(s) added",
      value: [],
    };
  }

  const insert_result = await db()
    .insert(billingInfo)
    .values(
      data.map((billing_info_data) => {
        return {
          id: crypto.randomUUID(),
          ...billing_info_data,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} billing info(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateBillingInfoBy(
  by: HelperParam<NewBillingInfo>,
  data: Partial<NewBillingInfo>
): Promise<HelperResult<BillingInfoWithPaymentAndSubMetersWithPayment[]>> {
  const { query } = by;
  const billing_info_param = { ...by, options: { ...by.options, fields: undefined } };
  const billing_info_result = await getBillingInfoBy(billing_info_param);

  if (!billing_info_result.valid || !billing_info_result.value) {
    return {
      valid: billing_info_result.valid,
      message: billing_info_result.message,
      value: [],
    };
  }

  const [old_billing_info] =
    billing_info_result.value as BillingInfoWithPaymentAndSubMetersWithPayment[];
  const conditions = generateQueryConditions<NewBillingInfo>(by);
  const changed_data = getChangedData(old_billing_info, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_billing_info],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db()
    .update(billingInfo)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} billing info(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

async function mapTenantReadingsToDTO(
  readings: (TenantReadingDTO & { tenant?: User; payment?: Payment })[]
): Promise<TenantReadingDTO[]> {
  return readings.map((reading) => ({
    id: reading.id,
    tenantUserId: reading.tenantUserId,
    billingInfoId: reading.billingInfoId,
    tenantName: reading.tenant?.name ?? "",
    subkWh: reading.subkWh,
    reading: reading.reading,
    status: reading.status as TenantReadingDTO["status"],
    paymentId: reading.paymentId,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
    payment: reading.payment,
  }));
}

export async function getBillingInfoBy(
  data: HelperParam<NewBillingInfo>
): Promise<HelperResult<Partial<BillingInfoWithPaymentAndSubMetersWithPayment>[]>> {
  const { options } = data;
  const conditions = generateQueryConditions<NewBillingInfo>(data);
  const queryOptions: BillingInfoQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    ...(options && {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.order ? { date: options.order } : undefined,
    }),
  };
  if (options && options.fields) {
    if (options.fields.length > 0) {
      queryOptions.columns = options.fields.reduce(
        (acc, key) => ({ ...acc, [key as string]: true }),
        {}
      );
    }
  }
  const findManyOptions: any = {
    ...queryOptions,
    with: {
      payment: options?.with_payment,
      ...(options?.with_sub_meters && {
        tenantReadings: {
          with: { tenant: true },
        },
      }),
      ...(options?.with_sub_meters_with_payment && {
        tenantReadings: {
          with: {
            payment: true,
            tenant: true,
          },
        },
      }),
    },
  };
  if (queryOptions.columns) {
    findManyOptions.columns = {
      ...queryOptions.columns,
      createdAt: true,
      updatedAt: true,
    };
  }
  const queryDBResult = (await db().query.billingInfo.findMany(findManyOptions)) as (BillingInfo & {
    payment?: Payment;
    tenantReadings?: (TenantReadingDTO & { tenant?: User; payment?: Payment })[];
    subMeters?: TenantReadingDTO[];
  })[];

  // Map tenantReadings into the `subMeters` key with rich DTOs (tenantName).
  // The key name is kept for remote + test compatibility.
  const withSubMeters = options?.with_sub_meters || options?.with_sub_meters_with_payment || false;
  if (withSubMeters && queryDBResult.length > 0) {
    for (const row of queryDBResult) {
      row.subMeters = await mapTenantReadingsToDTO(row.tenantReadings ?? []);
      delete row.tenantReadings;
    }
  }

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} billing info(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getBillingInfos(
  data: HelperParam<NewBillingInfo>
): Promise<Partial<BillingInfoDTO>[]> {
  const billingInfosResult = await getBillingInfoBy(data);
  return !billingInfosResult.valid || !billingInfosResult.value
    ? []
    : mapNewBillingInfo_to_DTO(billingInfosResult.value);
}

export function mapNewBillingInfo_to_DTO(data: Partial<BillingInfo>[]): Partial<BillingInfoDTO>[] {
  return data.map((_billing_info) => ({
    id: _billing_info.id,
    userId: _billing_info.userId,
    date: _billing_info.date,
    totalkWh: _billing_info.totalkWh,
    balance: _billing_info.balance,
    status: _billing_info.status as BillingInfoDTO["status"],
    payPerkWh: _billing_info.payPerkWh,
    paymentId: _billing_info.paymentId,
    createdAt: _billing_info.createdAt,
    updatedAt: _billing_info.updatedAt,
  }));
}

export async function getBillingInfoCountBy(
  data: HelperParam<NewBillingInfo>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, userId } = query;
  const conditions = generateQueryConditions<NewBillingInfo>(data);
  const request_query = db().select({ count: count() }).from(billingInfo);

  if (id || userId) {
    request_query.limit(1);
  }

  const whereSQL = buildWhereSQL(conditions);
  const [_data] = await request_query.where(whereSQL);

  const _count = _data?.count;
  const is_valid = _count > 0;
  return {
    valid: is_valid,
    message: is_valid
      ? `Billing info(s) count is ${_count}`
      : `Billing info(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export async function deleteBillingInfoBy(
  data: HelperParam<NewBillingInfo>
): Promise<HelperResult<number>> {
  const { query } = data;
  const conditions = generateQueryConditions<NewBillingInfo>(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await db()
    .delete(billingInfo)
    .where(whereSQL)
    .returning({ deletedId: billingInfo.id });

  const deletedCount = deleteResult.length ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} billing info(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
}

function buildWhereSQL(where: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      const notCondition = not(eq(billingInfo.id, notObj.id));
      if (notCondition) conditions.push(notCondition);
    } else if (key === "id") {
      conditions.push(eq(billingInfo.id, value as string));
    } else if (key === "userId") {
      conditions.push(eq(billingInfo.userId, value as string));
    } else if (key === "date") {
      conditions.push(eq(billingInfo.date, value as Date));
    } else if (key === "totalkWh") {
      conditions.push(eq(billingInfo.totalkWh, value as number));
    } else if (key === "balance") {
      conditions.push(eq(billingInfo.balance, value as number));
    } else if (key === "status") {
      conditions.push(eq(billingInfo.status, value as string));
    } else if (key === "payPerkWh") {
      conditions.push(eq(billingInfo.payPerkWh, value as number));
    } else if (key === "paymentId") {
      conditions.push(eq(billingInfo.paymentId, value as string));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/*
 * computeTenantUsages
 *
 * Computes per-tenant usage for a set of sub-meters (tenants). A tenant's
 * usage is its reading delta against its most recent billed reading; a tenant
 * with no previous reading carries 0 usage (baseline).
 */
export function computeTenantUsages(
  entries: {
    tenant: { id: string; name: string };
    reading: number;
    prevReading: number | null;
  }[],
  payPerkWh: number
): Map<string, { usage: number; payment: number }> {
  const usages = new Map<string, { usage: number; payment: number }>();
  for (const entry of entries) {
    const rawDelta = entry.prevReading === null ? 0 : entry.reading - entry.prevReading;
    if (rawDelta < 0) {
      throw error(400, `Invalid reading for sub meter "${entry.tenant.name}"`);
    }
    const payment = Number((rawDelta * payPerkWh).toFixed(2));
    usages.set(entry.tenant.id, { usage: rawDelta, payment });
  }
  return usages;
}

type ResolvedTenant = {
  entry: BillingSubMeterForm;
  tenant: User;
};

/*
 * resolveTenants
 *
 * Resolves the form's tenant references to tenant accounts belonging to the
 * owner. Sub-meters ARE tenants: the entry's tenantUserId is the sub-meter id.
 */
async function resolveTenants(
  userId: string,
  subMeters: BillingSubMeterForm[]
): Promise<ResolvedTenant[]> {
  const resolved: ResolvedTenant[] = [];
  const seen = new Set<string>();
  for (const entry of subMeters) {
    const tenant = await db().query.user.findFirst({ where: { id: entry.tenantUserId } });
    if (!tenant || tenant.ownerId !== userId) {
      throw error(400, "Unknown sub meter tenant");
    }
    if (seen.has(tenant.id)) {
      throw error(400, "Duplicate sub meter");
    }
    seen.add(tenant.id);
    resolved.push({ entry, tenant });
  }
  return resolved;
}

/**
 * The tenant's most recent billed reading, optionally restricted to records
 * strictly before `beforeDate`. This is the baseline for usage computation.
 * Unlike the immediately-previous record, this searches back to the most
 * recent record that actually contains the tenant, so a tenant omitted from
 * the latest record keeps its true baseline.
 */
export async function getLastTenantReading(
  userId: string,
  tenantUserId: string,
  beforeDate?: Date
): Promise<number | null> {
  const [row] = await db()
    .select({ reading: tenantReading.reading })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(
      and(
        eq(billingInfo.userId, userId),
        eq(tenantReading.tenantUserId, tenantUserId),
        // Pending rows (tenant has not submitted yet) are not baselines
        isNotNull(tenantReading.reading),
        beforeDate ? lt(billingInfo.date, beforeDate) : undefined
      )
    )
    .orderBy(desc(billingInfo.date))
    .limit(1);
  return row?.reading ?? null;
}

/*
 * createBillingInfoLogic
 *
 * - Recreates the logic previously in the billing-info remote layer.
 * - Uses a single D1 batch to persist payments, billing info, and tenant readings.
 */
export async function createBillingInfoLogic(
  data: BillingCreateForm,
  userId: string
): Promise<BillingInfo> {
  const { date, totalkWh, balance, status, subMeters } = data;
  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  const user = await db().query.user.findFirst({ where: { id: userId } });
  if (user?.ownerId) {
    throw error(403, "Tenant accounts cannot create billing records");
  }

  const resolved = await resolveTenants(userId, subMeters);

  const allPending = resolved.every(({ entry }) => entry.reading == null);
  const anyPending = resolved.some(({ entry }) => entry.reading == null);
  if (anyPending && !allPending) {
    throw error(
      400,
      "Either provide readings for every sub meter, or none to create a pending billing"
    );
  }

  // Pending billing: create the record with tenant rows waiting for readings.
  // Tenants submit readings for this billing, then `finalizeBillingInfoLogic`
  // materializes the usage and payments.
  if (allPending) {
    const database = db();
    const billingInfoId = crypto.randomUUID();

    const batchQueries: BatchQuery[] = [
      database
        .insert(billingInfo)
        .values({
          id: billingInfoId,
          userId,
          date: new Date(date),
          totalkWh,
          balance,
          status,
          payPerkWh,
        })
        .returning(),
    ];

    for (const { entry, tenant } of resolved) {
      batchQueries.push(
        database.insert(tenantReading).values({
          id: crypto.randomUUID(),
          tenantUserId: tenant.id,
          billingInfoId,
          status: entry.status ?? "pending",
        })
      );
    }

    const batchPayload = asNonEmptyBatch(batchQueries);
    if (!batchPayload) {
      throw error(400, "Failed to add billing info, no batch queries were generated");
    }
    const batchResults = await database.batch(batchPayload);
    const createdBillingInfo = Array.isArray(batchResults[0]) ? batchResults[0][0] : undefined;

    if (!createdBillingInfo) {
      throw error(400, "Failed to add billing info, billing info not processed");
    }

    return createdBillingInfo;
  }

  const usages = computeTenantUsages(
    await Promise.all(
      resolved.map(async ({ entry, tenant }) => {
        if (entry.reading == null) {
          throw error(400, "Provide a reading for every sub meter");
        }
        return {
          tenant,
          reading: entry.reading,
          prevReading: await getLastTenantReading(userId, tenant.id),
        };
      })
    ),
    payPerkWh
  );

  const totalSubPayment = [...usages.values()].reduce((sum, u) => sum + u.payment, 0);
  const totalSubkWh = [...usages.values()].reduce((sum, u) => sum + u.usage, 0);

  const mainUsage = totalkWh - totalSubkWh;
  const mainPaymentAmount = Number((balance - totalSubPayment).toFixed(2));
  if (mainPaymentAmount < 0) {
    throw error(400, "Main payment amount cannot be negative");
  }

  if (mainUsage < 0) {
    throw error(400, "Invalid meter readings, computed kWh usage does not meet total kWh usage");
  }

  const database = db();
  const mainPaymentId = crypto.randomUUID();
  const billingInfoId = crypto.randomUUID();

  const batchQueries: BatchQuery[] = [];

  batchQueries.push(
    database.insert(payment).values({
      id: mainPaymentId,
      amount: mainPaymentAmount,
      date: new Date(),
    })
  );

  const billingInfoResultIndex = batchQueries.length;
  batchQueries.push(
    database
      .insert(billingInfo)
      .values({
        id: billingInfoId,
        userId,
        date: new Date(date),
        totalkWh,
        balance,
        status,
        payPerkWh,
        paymentId: mainPaymentId,
      })
      .returning()
  );

  for (const { entry, tenant } of resolved) {
    const { usage, payment: paymentAmount } = usages.get(tenant.id)!;

    const subPaymentId = crypto.randomUUID();

    batchQueries.push(
      database.insert(payment).values({
        id: subPaymentId,
        amount: paymentAmount,
      })
    );

    batchQueries.push(
      database.insert(tenantReading).values({
        id: crypto.randomUUID(),
        tenantUserId: tenant.id,
        billingInfoId,
        reading: entry.reading,
        subkWh: usage,
        paymentId: subPaymentId,
        status: entry.status,
      })
    );
  }

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to add billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const createdBillingInfo = Array.isArray(batchResults[billingInfoResultIndex])
    ? batchResults[billingInfoResultIndex][0]
    : undefined;

  if (!createdBillingInfo) {
    throw error(400, "Failed to add billing info, billing info not processed");
  }

  return createdBillingInfo;
}

/*
 * updateBillingInfoLogic
 *
 * - Recreates the logic previously in the billing-info remote layer.
 * - Recomputes sub-meter usage against the PREVIOUS billed reading for each
 *   tenant (the most recent record strictly before this one that contains
 *   them), not the record's own stored readings, so editing a record keeps
 *   the cumulative progression consistent.
 * - Persists the recomputed `payPerkWh` on the billing info record.
 * - Removes tenant readings together with their linked payment rows so no
 *   orphaned payments are left behind.
 * - Uses a single D1 batch to persist all changes.
 */
export async function updateBillingInfoLogic(
  data: BillingUpdateForm,
  userId: string
): Promise<BillingInfo> {
  const { id: billingInfoId, subMeters, ...updateData } = data;

  const {
    valid: validBillingInfo,
    value: [billingInfoWithSubMetersToUpdate],
  } = await getBillingInfoBy({
    query: { userId, id: billingInfoId },
    options: {
      fields: ["id", "date", "status", "balance", "totalkWh", "paymentId"],
      with_payment: true,
      with_sub_meters_with_payment: true,
    },
  });

  if (!validBillingInfo) {
    throw error(400, "Failed to update billing info");
  }

  const user = await db().query.user.findFirst({ where: { id: userId } });
  if (user?.ownerId) {
    throw error(403, "Tenant accounts cannot create billing records");
  }

  const updatedData = {
    ...updateData,
    date: new Date(updateData.date),
    ...(updateData.status && {
      status: updateData.status as string,
    }),
  };

  // Use the current billing info as-is for comparison.
  // Overriding `balance` with the payment amount can cause false-positive
  // change detection when the payment amount differs from the stored balance.
  const changed_data = getChangedData(
    omit(billingInfoWithSubMetersToUpdate, ["id", "createdAt", "updatedAt", "paymentId"]),
    updatedData
  );

  // Determine whether provided subMeters actually differ from existing ones
  // (cheap checks) so we can skip heavy work when they don't.
  const existingSubMeters = billingInfoWithSubMetersToUpdate.subMeters ?? [];
  let subMetersHaveChanges = false;
  if (subMeters !== undefined && subMeters !== null) {
    if ((subMeters.length ?? 0) !== (existingSubMeters.length ?? 0)) {
      subMetersHaveChanges = true;
    }
    if (!subMetersHaveChanges) {
      const providedIds = subMeters.filter((s) => s.id !== undefined).map((s) => s.id);
      for (const s of subMeters) {
        if (!s.id) {
          subMetersHaveChanges = true;
          break;
        }
        const existing = existingSubMeters.find((m) => m.id === s.id);
        if (!existing) {
          subMetersHaveChanges = true;
          break;
        }
        if (
          existing.tenantUserId !== s.tenantUserId ||
          existing.reading !== s.reading ||
          existing.status !== s.status
        ) {
          subMetersHaveChanges = true;
          break;
        }
      }
      if (!subMetersHaveChanges) {
        for (const existing of existingSubMeters) {
          if (!providedIds.includes(existing.id)) {
            subMetersHaveChanges = true;
            break;
          }
        }
      }
    }
  }

  if (Object.keys(changed_data).length === 0 && !subMetersHaveChanges) {
    return billingInfoWithSubMetersToUpdate as BillingInfo;
  }

  const database = db();

  const recordDate = billingInfoWithSubMetersToUpdate.date;
  if (!recordDate) {
    throw error(400, "Failed to update billing info, missing record date");
  }

  const payPerkWh = calculatePayPerKwh(
    updateData.balance ?? billingInfoWithSubMetersToUpdate.balance,
    updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh
  );

  const resolved = subMeters ? await resolveTenants(userId, subMeters) : [];

  const usageByTenant = new Map<string, { usage: number; payment: number }>();
  if (resolved.length > 0) {
    const usages = computeTenantUsages(
      await Promise.all(
        resolved.map(async ({ entry, tenant }) => {
          if (entry.reading == null) {
            throw error(400, "Provide a reading for every sub meter");
          }
          return {
            tenant,
            reading: entry.reading,
            prevReading: await getLastTenantReading(userId, tenant.id, recordDate),
          };
        })
      ),
      payPerkWh
    );
    for (const [id, value] of usages) {
      usageByTenant.set(id, value);
    }
  }

  type PreparedSubMeter = {
    id?: string;
    tenantUserId: string;
    tenantName: string;
    reading: number;
    subkWh: number;
    status: string;
    paymentAmount: number;
    paymentId?: string | null;
  };
  const subMetersData: PreparedSubMeter[] = resolved.map(({ entry, tenant }) => {
    if (entry.reading == null) {
      throw error(400, "Provide a reading for every sub meter");
    }
    const { usage, payment: paymentAmount } = usageByTenant.get(tenant.id)!;

    const existing = entry.id ? existingSubMeters.find((m) => m.id === entry.id) : undefined;
    if (entry.id && !existing) {
      throw error(400, `Sub meter with id "${entry.id}" not found`);
    }
    return {
      id: entry.id,
      tenantUserId: tenant.id,
      tenantName: tenant.name,
      reading: entry.reading,
      subkWh: usage,
      status: entry.status ?? existing?.status ?? "pending",
      paymentAmount,
      paymentId: existing?.paymentId,
    };
  });

  // Validate that total sub-meter kWh does not exceed total billing kWh (prevents negative main usage)
  const totalSubkWh = subMetersData.reduce((sum, s) => sum + s.subkWh, 0);
  const totalkWhForCheck = updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh ?? 0;
  if (totalSubkWh > totalkWhForCheck) {
    throw error(
      400,
      "Invalid meter readings, sub-meter kWh exceeds total kWh (main usage negative)"
    );
  }

  // Perform all DB operations in a single D1 batch
  const batchQueries: BatchQuery[] = [];
  let billingInfoResultIndex: number | null = null;

  if (Object.keys(changed_data).length > 0) {
    billingInfoResultIndex = batchQueries.length;
    batchQueries.push(
      database
        .update(billingInfo)
        .set({
          ...changed_data,
          // Keep the stored rate in sync with the values used for payment math.
          payPerkWh,
        })
        .where(eq(billingInfo.id, billingInfoId))
        .returning()
    );
  }

  // Handle sub meters update if provided and only if changes detected
  if (subMeters && subMetersHaveChanges) {
    const existingIds = billingInfoWithSubMetersToUpdate.subMeters?.map((s) => s.id) || [];
    const providedIds = subMetersData.filter((s) => s.id !== undefined).map((s) => s.id!);
    const toDeleteIds = existingIds.filter((id) => !providedIds.includes(id));

    if (toDeleteIds.length > 0) {
      const toDeleteSubMeters = existingSubMeters.filter((s) => toDeleteIds.includes(s.id));
      const toDeletePaymentIds = toDeleteSubMeters
        .map((s) => s.paymentId)
        .filter((id): id is string => !!id);

      batchQueries.push(
        database.delete(tenantReading).where(inArray(tenantReading.id, toDeleteIds))
      );
      // Remove linked payments too so no orphaned rows accumulate.
      if (toDeletePaymentIds.length > 0) {
        batchQueries.push(database.delete(payment).where(inArray(payment.id, toDeletePaymentIds)));
      }
    }

    for (const subData of subMetersData) {
      if (subData.id) {
        const existing = existingSubMeters.find((m) => m.id === subData.id);
        if (existing?.paymentId) {
          // Already materialized (tenant submitted or a previous edit) — update
          // the reading and its linked payment.
          batchQueries.push(
            database
              .update(tenantReading)
              .set({
                reading: subData.reading,
                subkWh: subData.subkWh,
                status: subData.status,
              })
              .where(eq(tenantReading.id, subData.id))
          );

          batchQueries.push(
            database
              .update(payment)
              .set({ amount: subData.paymentAmount })
              .where(eq(payment.id, existing.paymentId))
          );
        } else {
          // Pending row (tenant has not submitted yet) — the owner is setting
          // the reading, so materialize the usage and payment now.
          const newPaymentId = crypto.randomUUID();

          batchQueries.push(
            database.insert(payment).values({
              id: newPaymentId,
              date: new Date(),
              amount: subData.paymentAmount,
            })
          );

          batchQueries.push(
            database
              .update(tenantReading)
              .set({
                reading: subData.reading,
                subkWh: subData.subkWh,
                paymentId: newPaymentId,
                status: subData.status,
              })
              .where(eq(tenantReading.id, subData.id))
          );
        }
      } else {
        // add new
        const newPaymentId = crypto.randomUUID();

        batchQueries.push(
          database.insert(payment).values({
            id: newPaymentId,
            date: new Date(),
            amount: subData.paymentAmount,
          })
        );

        batchQueries.push(
          database.insert(tenantReading).values({
            id: crypto.randomUUID(),
            tenantUserId: subData.tenantUserId,
            billingInfoId,
            reading: subData.reading,
            subkWh: subData.subkWh,
            paymentId: newPaymentId,
            status: subData.status,
          })
        );
      }
    }
  }

  const existingMainPaymentId = billingInfoWithSubMetersToUpdate.paymentId;

  const totalSubPayment = subMetersHaveChanges
    ? subMetersData.reduce((sum, sub) => sum + sub.paymentAmount, 0)
    : (billingInfoWithSubMetersToUpdate.subMeters || []).reduce(
        (sum, sub) => sum + (sub.payment?.amount ?? 0),
        0
      );

  // Pending (unfinalized) billings have no main payment yet — leave it null
  // and auto-finalize below once every tenant reading is in.
  if (existingMainPaymentId) {
    const updatedBalance = updateData.balance ?? billingInfoWithSubMetersToUpdate.balance ?? 0;
    const mainPaymentAmount = updatedBalance - totalSubPayment;
    if (mainPaymentAmount < 0) {
      throw error(400, "Main payment amount cannot be negative");
    }

    batchQueries.push(
      database
        .update(payment)
        .set({
          amount: mainPaymentAmount,
        })
        .where(eq(payment.id, existingMainPaymentId))
    );
  }

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to update billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const updatedBillingInfo =
    billingInfoResultIndex !== null
      ? Array.isArray(batchResults[billingInfoResultIndex])
        ? batchResults[billingInfoResultIndex][0]
        : undefined
      : (billingInfoWithSubMetersToUpdate as BillingInfo);

  if (billingInfoResultIndex !== null && !updatedBillingInfo) {
    throw error(400, "Failed to update billing info");
  }

  // A pending billing with all readings now filled (owner set them, or tenants
  // submitted earlier) is complete — materialize the main payment + mark paid.
  if (!existingMainPaymentId && subMeters && subMeters.length > 0) {
    return finalizeBillingInfoLogic(billingInfoId, userId);
  }

  return updatedBillingInfo;
}

/**
 * finalizeBillingInfoLogic
 *
 * Materializes a pending billing: for each tenant row with a submitted
 * reading, computes usage against the tenant's most recent billed reading
 * (strictly before this record), creates the sub payments and the main
 * payment, and marks the rows and record as paid. Tenants that have not
 * submitted yet are left pending.
 */
export async function finalizeBillingInfoLogic(
  billingInfoId: string,
  userId: string
): Promise<BillingInfo> {
  const {
    valid,
    value: [billing],
  } = await getBillingInfoBy({
    query: { userId, id: billingInfoId },
    options: {
      fields: ["id", "date", "balance", "totalkWh", "status", "payPerkWh", "paymentId"],
      with_sub_meters_with_payment: true,
    },
  });

  if (!valid) {
    throw error(400, "Failed to finalize billing info");
  }
  if (billing.paymentId) {
    throw error(400, "Billing info is already finalized");
  }

  const recordDate = billing.date;
  if (!recordDate) {
    throw error(400, "Failed to finalize billing info, missing record date");
  }

  const balance = billing.balance;
  const totalkWh = billing.totalkWh;
  if (balance == null || totalkWh == null) {
    throw error(400, "Failed to finalize billing info, missing balance or total kWh");
  }

  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  const allRows = billing.subMeters ?? [];

  // Rows already materialized at submission carry their own payment; only
  // pending rows (reading set, no payment yet) get payments created here.
  const existingSubPayment = allRows.reduce((sum, s) => sum + (s.payment?.amount ?? 0), 0);
  const rows = allRows.filter(
    (s): s is TenantReadingDTO & { reading: number } => s.reading != null && s.paymentId == null
  );
  if (rows.length === 0 && existingSubPayment === 0) {
    throw error(400, "No tenant readings to finalize");
  }

  const usages = computeTenantUsages(
    await Promise.all(
      rows.map(async (s) => ({
        tenant: { id: s.tenantUserId, name: s.tenantName },
        reading: s.reading,
        prevReading: await getLastTenantReading(userId, s.tenantUserId, recordDate),
      }))
    ),
    payPerkWh
  );

  const newSubPayment = [...usages.values()].reduce((sum, u) => sum + u.payment, 0);
  const totalSubPayment = existingSubPayment + newSubPayment;
  const existingSubkWh = allRows.reduce((sum, s) => sum + (s.subkWh ?? 0), 0);
  const totalSubkWh = existingSubkWh + [...usages.values()].reduce((sum, u) => sum + u.usage, 0);

  const mainUsage = totalkWh - totalSubkWh;
  const mainPaymentAmount = Number((balance - totalSubPayment).toFixed(2));
  if (mainPaymentAmount < 0) {
    throw error(400, "Main payment amount cannot be negative");
  }
  if (mainUsage < 0) {
    throw error(400, "Invalid meter readings, computed kWh usage does not meet total kWh usage");
  }

  const database = db();
  const mainPaymentId = crypto.randomUUID();
  const batchQueries: BatchQuery[] = [
    database.insert(payment).values({
      id: mainPaymentId,
      amount: mainPaymentAmount,
      date: new Date(),
    }),
  ];

  for (const s of rows) {
    const { usage, payment: paymentAmount } = usages.get(s.tenantUserId)!;

    const subPaymentId = crypto.randomUUID();

    batchQueries.push(
      database.insert(payment).values({
        id: subPaymentId,
        amount: paymentAmount,
      })
    );

    batchQueries.push(
      database
        .update(tenantReading)
        .set({
          reading: s.reading,
          subkWh: usage,
          paymentId: subPaymentId,
          status: "paid",
        })
        .where(eq(tenantReading.id, s.id))
    );
  }

  const billingResultIndex = batchQueries.length;
  batchQueries.push(
    database
      .update(billingInfo)
      .set({
        paymentId: mainPaymentId,
        payPerkWh,
        status: "paid",
      })
      .where(eq(billingInfo.id, billingInfoId))
      .returning()
  );

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to finalize billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const updatedBillingInfo = Array.isArray(batchResults[billingResultIndex])
    ? batchResults[billingResultIndex][0]
    : undefined;

  if (!updatedBillingInfo) {
    throw error(400, "Failed to finalize billing info");
  }

  return updatedBillingInfo;
}

export async function getTotalEnergyUsageLogic() {
  const event = getRequestEvent();
  const origin = event.request.headers.get("origin");
  const referer = event.request.headers.get("referer");
  const siteOrigin = event.url.origin;

  const isAllowedOrigin =
    origin === siteOrigin || origin === null || (referer && referer.startsWith(siteOrigin));

  if (!isAllowedOrigin) {
    throw error(403, "Forbidden");
  }

  return await getTotalEnergyUsage();
}

export async function getTotalBillingInfoCountLogic() {
  originCheck();

  const result = await getBillingInfoCountBy({ query: {} });
  return result.value ?? 0;
}
