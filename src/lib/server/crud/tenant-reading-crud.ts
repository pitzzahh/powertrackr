import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { tenantReading } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewTenantReading } from "$/types/tenant-reading";
import type { Payment } from "$/types/payment";
import type { User } from "$/types/user";
import type { BillingInfo } from "$/types/billing-info";
import { generateQueryConditions } from "$/server/mapper";

type TenantReadingQueryOptions = {
  with?: { tenant?: true; payment?: true; billingInfo?: true };
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export type TenantReadingWithRelations = Partial<NewTenantReading> & {
  payment?: Payment;
  tenant?: User;
  billingInfo?: BillingInfo;
};

export async function addTenantReading(
  data: Omit<NewTenantReading, "id">[]
): Promise<HelperResult<NewTenantReading[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 tenant reading(s) added",
      value: [],
    };
  }

  const insert_result = await db()
    .insert(tenantReading)
    .values(
      data.map((tenant_reading_data) => {
        return {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...tenant_reading_data,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} tenant reading(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateTenantReadingBy(
  by: HelperParam<NewTenantReading>,
  data: Partial<NewTenantReading>
): Promise<HelperResult<NewTenantReading[]>> {
  const { query } = by;
  const tenant_reading_param = {
    ...by,
    options: { ...by.options, fields: undefined },
  };
  const tenant_reading_result = await getTenantReadingBy(tenant_reading_param);

  if (!tenant_reading_result.valid || !tenant_reading_result.value) {
    return {
      valid: tenant_reading_result.valid,
      message: tenant_reading_result.message,
      value: [],
    };
  }

  const [old_tenant_reading] = tenant_reading_result.value as NewTenantReading[];
  const conditions = generateQueryConditions<NewTenantReading>(by);
  const changed_data = getChangedData(old_tenant_reading, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_tenant_reading],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db()
    .update(tenantReading)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} tenant reading(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

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

export async function getTenantReadingCountBy(
  data: HelperParam<NewTenantReading>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, billingInfoId } = query;
  const conditions = generateQueryConditions<NewTenantReading>(data);
  const request_query = db().select({ count: count() }).from(tenantReading);

  if (id || billingInfoId) {
    request_query.limit(1);
  }

  const whereSQL = buildWhereSQL(conditions);
  const [_data] = await request_query.where(whereSQL);

  const _count = _data?.count;
  const is_valid = _count > 0;
  return {
    valid: is_valid,
    message: is_valid
      ? `Tenant reading(s) count is ${_count}`
      : `Tenant reading(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export async function deleteTenantReadingBy(
  data: HelperParam<NewTenantReading>
): Promise<HelperResult<number>> {
  const { query } = data;
  const conditions = generateQueryConditions<NewTenantReading>(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await db()
    .delete(tenantReading)
    .where(whereSQL)
    .returning({ deleteId: tenantReading.id });

  const deletedCount = deleteResult.length ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} tenant reading(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
}

function buildWhereSQL(where: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      const notCondition = not(eq(tenantReading.id, notObj.id));
      if (notCondition) conditions.push(notCondition);
    } else if (key === "id") {
      conditions.push(eq(tenantReading.id, value as string));
    } else if (key === "tenantUserId") {
      conditions.push(eq(tenantReading.tenantUserId, value as string));
    } else if (key === "billingInfoId") {
      conditions.push(eq(tenantReading.billingInfoId, value as string));
    } else if (key === "subkWh") {
      conditions.push(eq(tenantReading.subkWh, value as number));
    } else if (key === "reading") {
      conditions.push(eq(tenantReading.reading, value as number));
    } else if (key === "paymentId") {
      conditions.push(eq(tenantReading.paymentId, value as string));
    } else if (key === "status") {
      conditions.push(eq(tenantReading.status, value as string));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
