import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { billingInfo } from "$/server/db/schema";
import type { HelperParam, HelperResult, HelperParamOptions } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type {
  NewBillingInfo,
  BillingInfo,
  BillingInfoDTO,
  BillingInfoWithPaymentAndSubMetersWithPayment,
  BillingCreateForm,
} from "$/types/billing-info";
import { calculatePayPerKwh } from "$lib";
import { addPayment } from "$/server/crud/payment-crud";
import { addSubMeter } from "$/server/crud/sub-meter-crud";
import type { NewSubMeter } from "$/types/sub-meter";
import { error } from "@sveltejs/kit";

type BillingInfoQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { date: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addBillingInfo(
  data: Omit<NewBillingInfo, "id">[],
  tx?: HelperParamOptions<NewBillingInfo>["tx"]
): Promise<HelperResult<BillingInfo[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 billing info(s) added",
      value: [],
    };
  }

  const insert_result = await (tx || db)
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
  const { query, options } = by;
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
  const conditions = generateBillingInfoQueryConditions(by);
  const changed_data = getChangedData(old_billing_info, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_billing_info],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await (options?.tx || db)
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
  const conditions = generateBillingInfoQueryConditions(data);
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
  const queryDBResult = await (options?.tx || db).query.billingInfo.findMany(findManyOptions);

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
  const { query, options } = data;
  const { id, userId } = query;
  const conditions = generateBillingInfoQueryConditions(data);
  const request_query = (options?.tx || db).select({ count: count() }).from(billingInfo);

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

export function generateBillingInfoQueryConditions(data: HelperParam<NewBillingInfo>) {
  const { query, options } = data;
  const { id, userId, date, totalkWh, balance, status, payPerkWh, paymentId } = query;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (userId) where.userId = userId;
  if (date) where.date = date;
  if (totalkWh !== undefined) where.totalkWh = totalkWh;
  if (balance !== undefined) where.balance = balance;
  if (status) where.status = status;
  if (payPerkWh !== undefined) where.payPerkWh = payPerkWh;
  if (paymentId) where.paymentId = paymentId;

  if (options && options.exclude_id) {
    where.NOT = { id: options.exclude_id };
  }

  return where;
}

export async function deleteBillingInfoBy(
  data: HelperParam<NewBillingInfo>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const conditions = generateBillingInfoQueryConditions(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await (options?.tx || db).delete(billingInfo).where(whereSQL);

  const deletedCount = deleteResult.rowCount ?? 0;
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
      conditions.push(not(eq(billingInfo.id, notObj.id)));
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
 * - Uses the CRUD helpers (addPayment, addBillingInfo, addSubMeter) only.
 * - Accepts an optional `tx` so callers can run a whole import inside a
 *   single transaction (atomic batch imports).
 */
export async function createBillingInfoLogic(
  data: BillingCreateForm,
  userId: string,
  tx?: HelperParamOptions<NewBillingInfo>["tx"]
): Promise<BillingInfo> {
  const { date, totalkWh, balance, status, subMeters } = data;
  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  // Use tx in read operations if provided so we have consistent view inside a parent transaction
  const { value: billingInfoCount } = await getBillingInfoCountBy({
    query: { userId },
    options: { limit: 1, ...(tx ? { tx } : {}) },
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
      ...(tx ? { tx } : {}),
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
      // New sub meter: persist initial reading as baseline, do not bill it now
      subkWh = sub.reading;
      paymentAmount = 0;
    }

    return {
      label: sub.label,
      reading: sub.reading,
      subkWh,
      paymentAmount,
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

  const subMeterInserts: Omit<NewSubMeter, "id">[] = [];

  // If an outer transaction was provided, run all operations inside it (atomic with caller),
  // otherwise use the original internal transaction and keep post-transaction sub-meter insertion behavior.
  if (tx) {
    const {
      valid: validMainPayment,
      value: [mainPayment],
    } = await addPayment([{ amount: mainPaymentAmount, date: new Date() }], tx);

    if (!validMainPayment) {
      throw error(400, "Failed to add billing info, main payment not processed");
    }

    const {
      valid: validBillingInfo,
      value: [createdBillingInfo],
    } = await addBillingInfo(
      [
        {
          userId,
          date: new Date(date),
          totalkWh,
          balance,
          status,
          payPerkWh,
          paymentId: mainPayment.id,
        },
      ],
      tx
    );

    if (!validBillingInfo) {
      throw error(400, "Failed to add billing info, billing info not processed");
    }

    // Create sub payments and prepare sub meter inserts inside same tx
    for (const subData of subMetersData) {
      const {
        valid: validPayment,
        value: [addedPayment],
        message,
      } = await addPayment(
        [
          {
            amount: subData.paymentAmount,
          },
        ],
        tx
      );

      if (!validPayment) {
        throw error(500, `Failed to create sub payment: ${message || "Unknown reason"}`);
      }

      subMeterInserts.push({
        billingInfoId: createdBillingInfo.id,
        label: subData.label,
        subkWh: subData.subkWh,
        reading: subData.reading,
        paymentId: addedPayment.id,
      });
    }

    if (subMeterInserts.length > 0) {
      const { valid: subMeterAdded, message } = await addSubMeter(subMeterInserts, tx);
      if (!subMeterAdded) {
        throw error(500, `Failed to insert sub meters: ${message || "Unknown reason"}`);
      }
    }

    return createdBillingInfo;
  }

  // Backwards-compatible path: internal transaction for payments/billing and add sub meters afterwards
  const result = await db.transaction(async (txInner) => {
    let {
      valid: validMainPayment,
      value: [mainPayment],
    } = await addPayment([{ amount: mainPaymentAmount, date: new Date() }], txInner);

    if (!validMainPayment) {
      txInner.rollback();
      throw error(400, "Failed to add billing info, main payment not processed");
    }

    const {
      valid: validBillingInfo,
      value: [billingResult],
    } = await addBillingInfo(
      [
        {
          userId,
          date: new Date(date),
          totalkWh,
          balance,
          status,
          payPerkWh,
          paymentId: mainPayment.id,
        },
      ],
      txInner
    );

    if (!validBillingInfo) {
      txInner.rollback();
      throw error(400, "Failed to add billing info, billing info not processed");
    }

    for (const subData of subMetersData) {
      const {
        valid: validPayment,
        value: [addedPayment],
        message,
      } = await addPayment(
        [
          {
            amount: subData.paymentAmount,
          },
        ],
        txInner
      );
      if (!validPayment) {
        txInner.rollback();
        throw error(500, `Failed to create sub payment: ${message || "Unknown reason"}`);
      }
      subMeterInserts.push({
        billingInfoId: billingResult.id,
        label: subData.label,
        subkWh: subData.subkWh,
        reading: subData.reading,
        paymentId: addedPayment.id,
      });
    }

    return billingResult;
  });

  // Add sub meters after internal transaction (original behavior preserved)
  if (subMeterInserts.length > 0) {
    const { valid: subMeterAdded, message } = await addSubMeter(subMeterInserts);
    if (!subMeterAdded)
      throw error(500, `Failed to insert sub meters: ${message || "Unknown reason"}`);
  }

  return result;
}
