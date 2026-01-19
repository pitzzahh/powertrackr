import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { payment } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewPayment, PaymentDTO } from "$/types/payment";
import type { HelperParamOptions } from "../types/helper";

type PaymentQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addPayment(
  data: Omit<NewPayment, "id">[],
  tx?: HelperParamOptions<NewPayment>["tx"]
): Promise<HelperResult<NewPayment[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 payment(s) added",
      value: [],
    };
  }

  const insert_result = await (tx || db)
    .insert(payment)
    .values(
      data.map((payment_data) => {
        return {
          id: crypto.randomUUID(),
          ...payment_data,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} payment(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updatePaymentBy(
  by: HelperParam<NewPayment>,
  data: Partial<NewPayment>
): Promise<HelperResult<NewPayment[]>> {
  const { query, options } = by;
  const payment_param = { ...by, options: { ...by.options, fields: undefined } };
  const payment_result = await getPaymentBy(payment_param);

  if (!payment_result.valid || !payment_result.value) {
    return {
      valid: payment_result.valid,
      message: payment_result.message,
      value: [],
    };
  }

  const [old_payment] = payment_result.value as NewPayment[];
  const conditions = generatePaymentQueryConditions(by);
  const changed_data = getChangedData(old_payment, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_payment],
    };
  }
  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await (options?.tx || db)
    .update(payment)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} payment(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getPaymentBy(
  data: HelperParam<NewPayment>
): Promise<HelperResult<Partial<NewPayment>[]>> {
  const { options } = data;
  const conditions = generatePaymentQueryConditions(data);
  const queryOptions: PaymentQueryOptions = {
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
  const queryDBResult = await (options?.tx || db).query.payment.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} payment(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getPayments(data: HelperParam<NewPayment>): Promise<Partial<PaymentDTO>[]> {
  const paymentsResult = await getPaymentBy(data);
  return !paymentsResult.valid || !paymentsResult.value
    ? []
    : mapNewPayment_to_DTO(paymentsResult.value);
}

export function mapNewPayment_to_DTO(data: Partial<NewPayment>[]): Partial<PaymentDTO>[] {
  // basicaly does nothing atm
  return data.map((_payment) => ({
    id: _payment.id,
    amount: _payment.amount,
    date: _payment.date,
    createdAt: _payment.createdAt,
    updatedAt: _payment.updatedAt,
  }));
}

export async function getPaymentCountBy(
  data: HelperParam<NewPayment>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const { id, amount } = query;
  const conditions = generatePaymentQueryConditions(data);
  const request_query = (options?.tx || db).select({ count: count() }).from(payment);

  if (id || amount) {
    request_query.limit(1);
  }

  const whereSQL = buildWhereSQL(conditions);
  const [_data] = await request_query.where(whereSQL);

  const _count = _data?.count;
  const is_valid = _count > 0;
  return {
    valid: is_valid,
    message: is_valid
      ? `Payment(s) count is ${_count}`
      : `Payment(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export function generatePaymentQueryConditions(data: HelperParam<NewPayment>) {
  const { query, options } = data;
  const { id, amount, date } = query;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (amount !== undefined) where.amount = amount;
  if (date) where.date = date;

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
      conditions.push(not(eq(payment.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(payment.id, value as string));
    } else if (key === "amount") {
      conditions.push(eq(payment.amount, value as number));
    } else if (key === "date") {
      conditions.push(eq(payment.date, value as Date));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
