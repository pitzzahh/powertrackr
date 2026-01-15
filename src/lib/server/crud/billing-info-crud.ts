import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { billingInfo } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewBillingInfo, BillingInfoDTO } from "$/types/billing-info";

type BillingInfoQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addBillingInfo(
  data: Omit<NewBillingInfo, "id">[]
): Promise<HelperResult<NewBillingInfo[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 billing info(s) added",
      value: [],
    };
  }

  const insert_result = await db
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
): Promise<HelperResult<NewBillingInfo[]>> {
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

  const [old_billing_info] = billing_info_result.value as NewBillingInfo[];
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
  const updateDBRequest = await db
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
): Promise<HelperResult<Partial<NewBillingInfo>[]>> {
  const { options } = data;
  const conditions = generateBillingInfoQueryConditions(data);
  const queryOptions: BillingInfoQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    ...(options && {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.order ? { createdAt: options.order } : undefined,
    }),
  };
  if (options && options.fields && options.fields.length > 0) {
    queryOptions.columns = options.fields.reduce(
      (acc, key) => ({ ...acc, [key as string]: true }),
      {}
    );
  }
  const queryDBResult = await db.query.billingInfo.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} billing info(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getBillingInfos(
  data: HelperParam<NewBillingInfo>
): Promise<BillingInfoDTO[]> {
  const billingInfosResult = await getBillingInfoBy(data);
  return !billingInfosResult.valid || !billingInfosResult.value
    ? []
    : mapNewBillingInfo_to_DTO(billingInfosResult.value);
}

export async function mapNewBillingInfo_to_DTO(
  data: Partial<NewBillingInfo>[]
): Promise<BillingInfoDTO[]> {
  return data.map((_billing_info) => ({
    id: _billing_info.id ?? "",
    userId: _billing_info.userId ?? "",
    date: _billing_info.date ? new Date(_billing_info.date) : new Date(),
    totalkWh: _billing_info.totalkWh ?? 0,
    balance: _billing_info.balance ?? 0,
    status: (_billing_info.status as BillingInfoDTO["status"]) ?? "N/A",
    payPerkWh: _billing_info.payPerkWh ?? 0,
    paymentId: _billing_info.paymentId ?? null,
    createdAt: _billing_info.createdAt ? new Date(_billing_info.createdAt) : new Date(),
    updatedAt: _billing_info.updatedAt ? new Date(_billing_info.updatedAt) : new Date(),
  }));
}

export async function getBillingInfoCountBy(
  data: HelperParam<NewBillingInfo>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, userId } = query;
  const conditions = generateBillingInfoQueryConditions(data);
  const request_query = db.select({ count: count() }).from(billingInfo);

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
      conditions.push(eq(billingInfo.date, value as string));
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
