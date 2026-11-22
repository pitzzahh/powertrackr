import type { TenantReadingWithRelations } from "#lib/types/billing-info.js";
import { db } from "#lib/server/db/index.js";
import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import type { NewTenantReading } from "#lib/types/billing-info.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

type TenantReadingQueryOptions = {
  with?: { tenant?: true; payment?: true; billingInfo?: true };
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};
export async function getTenantReadingBy(
  data: HelperParam<NewTenantReading>
): Promise<HelperResult<TenantReadingWithRelations[]>> {
  const { options } = data;
  const conditions = generateQueryConditions<NewTenantReading>(data);
  const queryOptions: TenantReadingQueryOptions = {
    with: {
      ...(options && options.with_payment ? { payment: true } : {}),
      ...(options && options.with_billing_info ? { billingInfo: true } : {}),
      ...(options && options.with_tenant ? { tenant: true } : {}),
    },
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
  const queryDBResult = await db().query.tenantReading.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} tenant reading(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}
