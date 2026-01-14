import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { payment } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewPayment, PaymentDTO } from "$/types/payment";

type PaymentQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addPayment(
  data: Omit<NewPayment, "id">[]
): Promise<HelperResult<NewPayment[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 payment(s) added",
      value: [],
    };
  }

  const insert_result = await db
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
  const { query } = by;
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
  const updateDBRequest = await db.update(payment).set(changed_data).returning().where(whereSQL);

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
  const { limit, offset, order, fields } = options;
  const conditions = generatePaymentQueryConditions(data);
  const queryOptions: PaymentQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    limit,
    offset,
    orderBy: order ? { createdAt: order as "asc" | "desc" } : undefined,
  };
  if (fields && fields.length > 0) {
    queryOptions.columns = fields.reduce((acc, key) => ({ ...acc, [key as string]: true }), {});
  }
  const queryDBResult = await db.query.payment.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} payment(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getPayments(data: HelperParam<NewPayment>): Promise<PaymentDTO[]> {
  const paymentsResult = await getPaymentBy(data);
  return !paymentsResult.valid || !paymentsResult.value
    ? []
    : mapNewPayment_to_DTO(paymentsResult.value);
}

export async function mapNewPayment_to_DTO(data: Partial<NewPayment>[]): Promise<PaymentDTO[]> {
  return data.map((_payment) => ({
    id: _payment.id ?? "",
    amount: _payment.amount ?? null,
    date: _payment.date ?? "",
    // Convert stored ISO strings to Date objects for DTO consumers
    createdAt:
      typeof _payment.createdAt === "string"
        ? new Date(_payment.createdAt)
        : (_payment.createdAt ?? new Date()),
    updatedAt:
      typeof _payment.updatedAt === "string"
        ? new Date(_payment.updatedAt)
        : (_payment.updatedAt ?? new Date()),
  }));
}

export async function getPaymentCountBy(
  data: HelperParam<NewPayment>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, amount } = query;
  const conditions = generatePaymentQueryConditions(data);
  const request_query = db.select({ count: count() }).from(payment);

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
  const { exclude_id } = options;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (amount !== undefined) where.amount = amount;
  if (date) where.date = date;

  if (exclude_id) {
    where.NOT = { id: exclude_id };
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
      conditions.push(eq(payment.date, value as string));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
