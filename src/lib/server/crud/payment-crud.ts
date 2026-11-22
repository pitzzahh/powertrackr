import { db } from "#lib/server/db/index.js";

import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import type { NewPayment, Payment } from "#lib/types/payment.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

type PaymentQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function getPaymentBy(
  data: HelperParam<NewPayment>
): Promise<HelperResult<Partial<Payment>[]>> {
  const { options } = data;
  const conditions = generateQueryConditions<NewPayment>(data);
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
  const queryDBResult = await db().query.payment.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} payment(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}
