import { db, asNonEmptyBatch } from "$/server/db";
import type { BatchQuery } from "$/server/db";
import { and, count, eq, inArray, not, sum, type SQL } from "drizzle-orm";
import { billingInfo, payment, subMeter } from "$/server/db/schema";
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
} from "$/types/billing-info";
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
  const formatted = formatEnergy(total);

  return { total, formatted, energyUnit: getEnergyUnit(total) };
}

type BillingInfoQueryOptions = {
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
    } else {
    }
  }
  const findManyOptions: any = {
    ...queryOptions,
    with: {
      payment: options?.with_payment,
      ...(options?.with_sub_meters && {
        subMeters: true,
      }),
      ...(options?.with_sub_meters_with_payment && {
        subMeters: {
          with: {
            payment: true,
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
  const queryDBResult = await db().query.billingInfo.findMany(findManyOptions);

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
 * createBillingInfoLogic
 *
 * - Recreates the logic previously in the billing-info remote layer.
 * - Uses a single D1 batch to persist payments, billing info, and sub meters.
 */
export async function createBillingInfoLogic(
  data: BillingCreateForm,
  userId: string
): Promise<BillingInfo> {
  const { date, totalkWh, balance, status, subMeters } = data;
  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  // Resolve latest billing info for sub-meter baseline comparisons
  const { value: billingInfoCount } = await getBillingInfoCountBy({
    query: { userId },
    options: { limit: 1 },
  });

  const {
    valid: validLatestBillingInfo,
    value: [latestBillingInfo],
  } = await getBillingInfoBy({
    query: { userId },
    options: {
      with_sub_meters: true,
      order: "desc",
      limit: 1,
    },
  });

  if (billingInfoCount > 0 && !validLatestBillingInfo) {
    throw error(400, "Failed to add new billing info, cannot get previous billing info");
  }

  // Process multiple sub meters (compute subkWh and payment amounts)
  const subMetersData = subMeters.map((sub) => {
    const currentMeter = latestBillingInfo?.subMeters?.find((m) => m.label === sub.label);

    let subkWh = 0;
    let paymentAmount = 0;
    if (currentMeter) {
      const previousReading = currentMeter.reading;
      subkWh = sub.reading - previousReading;
      if (subkWh < 0) {
        throw error(400, `Invalid reading for sub meter "${sub.label}"`);
      }
      paymentAmount = Number((subkWh * payPerkWh).toFixed(2));
    } else {
      if (sub.reading < 0) {
        throw error(400, `Invalid reading for sub meter "${sub.label}"`);
      }
      // New sub meter: persist initial reading as baseline, do not bill it now.
      // Baseline meters carry 0 usage (`subkWh = 0`) and no payment.
      subkWh = 0;
      paymentAmount = 0;
    }

    return {
      label: sub.label,
      reading: sub.reading,
      subkWh,
      paymentAmount,
      status: sub.status,
    };
  });

  const totalSubPaymentAmount = subMetersData.reduce((sum, s) => sum + s.paymentAmount, 0);
  const totalSubkWh = subMetersData.reduce((sum, s) => sum + s.subkWh, 0);

  const mainPaymentAmount = Number((balance - totalSubPaymentAmount).toFixed(2));
  if (mainPaymentAmount < 0) {
    throw error(400, "Main payment amount cannot be negative");
  }

  const mainTotalkWhUsed = totalkWh - totalSubkWh;

  if (mainTotalkWhUsed + totalSubkWh != totalkWh) {
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

  for (const subData of subMetersData) {
    const subPaymentId = crypto.randomUUID();
    const subMeterId = crypto.randomUUID();

    batchQueries.push(
      database.insert(payment).values({
        id: subPaymentId,
        amount: subData.paymentAmount,
      })
    );

    batchQueries.push(
      database.insert(subMeter).values({
        id: subMeterId,
        billingInfoId,
        label: subData.label,
        subkWh: subData.subkWh,
        reading: subData.reading,
        paymentId: subPaymentId,
        status: subData.status,
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
 * - Recomputes sub-meter usage against the PREVIOUS billing period's readings
 *   (matched by label), not the record's own stored readings, so editing a
 *   record keeps the cumulative meter progression consistent.
 * - Persists the recomputed `payPerkWh` on the billing info record.
 * - Removes sub meters together with their linked payment rows so no
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
    // If counts differ, there were additions/removals
    if ((subMeters.length ?? 0) !== (existingSubMeters.length ?? 0)) {
      subMetersHaveChanges = true;
    }
    // Quick scan: new items (no id) or any mismatch in id/label/reading
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
          existing.label !== s.label ||
          existing.reading !== s.reading ||
          existing.status !== s.status
        ) {
          subMetersHaveChanges = true;
          break;
        }
      }
      // Also detect deletions (an existing id not present in provided ids)
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

  // Previous billing period (strictly before this record's date) used as the
  // baseline for sub-meter usage calculations, matching createBillingInfoLogic.
  const previousBillingInfo = await database.query.billingInfo.findFirst({
    where: {
      userId,
      date: { lt: recordDate },
    },
    orderBy: { date: "desc" },
    with: { subMeters: true },
  });

  // Prepare sub meters data first (compute without DB calls)
  const payPerkWh = calculatePayPerKwh(
    updateData.balance ?? billingInfoWithSubMetersToUpdate.balance,
    updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh
  );
  // Only compute the rich subMetersData if there are changes to process
  type PreparedSubMeter = {
    id?: string;
    label: string;
    reading: number;
    subkWh: number;
    status: string;
    paymentAmount: number;
    paymentId?: string;
  };
  const subMetersData: PreparedSubMeter[] =
    subMeters?.map((sub) => {
      if (sub.id) {
        const currentMeter = billingInfoWithSubMetersToUpdate.subMeters?.find(
          (m) => m.id === sub.id
        );
        if (!currentMeter) {
          throw error(400, `Sub meter with id "${sub.id}" not found`);
        }
        // Baseline comes from the previous billing period (same label), not from
        // this record's own stored reading.
        const previousMeter = previousBillingInfo?.subMeters?.find((m) => m.label === sub.label);
        const subkWh = previousMeter ? sub.reading - previousMeter.reading : 0;
        if (subkWh < 0) {
          throw error(400, `Invalid reading for sub meter "${sub.label}"`);
        }
        const paymentAmount = Number((subkWh * payPerkWh).toFixed(2));
        return {
          id: sub.id,
          label: sub.label,
          reading: sub.reading,
          subkWh,
          status: sub.status ?? currentMeter.status,
          paymentAmount,
          paymentId: currentMeter.paymentId,
        };
      } else {
        // new sub meter - persist initial reading as baseline (reading) but do NOT bill it
        if (sub.reading < 0) {
          throw error(400, `Invalid reading for sub meter "${sub.label}"`);
        }
        return {
          label: sub.label,
          reading: sub.reading,
          subkWh: 0, // starting sub meter => 0 usage
          paymentAmount: 0,
          status: sub.status ?? "pending",
        };
      }
    }) ?? [];

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
    const providedIds = subMeters.filter((s) => s.id !== undefined).map((s) => s.id!);
    const toDeleteIds = existingIds.filter((id) => !providedIds.includes(id));

    if (toDeleteIds.length > 0) {
      const toDeleteSubMeters = existingSubMeters.filter((s) => toDeleteIds.includes(s.id));
      const toDeletePaymentIds = toDeleteSubMeters
        .map((s) => s.paymentId)
        .filter((id): id is string => !!id);

      batchQueries.push(database.delete(subMeter).where(inArray(subMeter.id, toDeleteIds)));
      // Remove linked payments too so no orphaned rows accumulate.
      if (toDeletePaymentIds.length > 0) {
        batchQueries.push(database.delete(payment).where(inArray(payment.id, toDeletePaymentIds)));
      }
    }

    for (const subData of subMetersData) {
      if (subData.id) {
        if (!subData.paymentId) {
          throw error(400, `Sub meter "${subData.label}" missing linked payment`);
        }
        // update existing
        batchQueries.push(
          database
            .update(subMeter)
            .set({
              reading: subData.reading,
              subkWh: subData.subkWh,
              status: subData.status,
            })
            .where(eq(subMeter.id, subData.id))
        );

        batchQueries.push(
          database
            .update(payment)
            .set({ amount: subData.paymentAmount })
            .where(eq(payment.id, subData.paymentId))
        );
      } else {
        // add new
        const newPaymentId = crypto.randomUUID();
        const newSubMeterId = crypto.randomUUID();

        batchQueries.push(
          database.insert(payment).values({
            id: newPaymentId,
            date: new Date(),
            amount: subData.paymentAmount,
          })
        );

        batchQueries.push(
          database.insert(subMeter).values({
            id: newSubMeterId,
            label: subData.label,
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

  if (!billingInfoWithSubMetersToUpdate.paymentId) {
    throw error(400, "Billing info missing payment ID");
  }

  const totalSubPayment = subMetersHaveChanges
    ? subMetersData.reduce((sum, sub) => sum + sub.paymentAmount, 0)
    : (billingInfoWithSubMetersToUpdate.subMeters || []).reduce(
        (sum, sub) => sum + (sub.payment?.amount ?? 0),
        0
      );

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
      .where(eq(payment.id, billingInfoWithSubMetersToUpdate.paymentId))
  );

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
