import { db } from "#lib/server/db/index.js";
import { and, eq, inArray, not, type SQL } from "drizzle-orm";
import { billingInfo, payment, tenantReading } from "#lib/server/db/schema/index.js";
import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import type { BillingInfo, NewBillingInfo } from "#lib/types/billing-info.js";
import type { BillingInfoWithPaymentAndSubMetersWithPayment } from "#lib/types/billing-info.js";
import type { TenantReadingDTO } from "#lib/types/billing-info.js";
import type { User } from "#lib/types/user.js";
import type { Payment } from "#lib/types/payment.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

type BillingInfoQueryOptions = {
  with?: Record<string, unknown>;
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { date: "asc" | "desc" };
  columns?: Record<string, true>;
};

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

  const database = db();
  // Payments only point *to* nothing: billing_info and tenant_reading reference
  // them. Collect the main + sub payment ids first and delete them in the same
  // batch, so removing a billing leaves no orphaned payment rows behind.
  const targets = await database
    .select({ id: billingInfo.id, paymentId: billingInfo.paymentId })
    .from(billingInfo)
    .where(whereSQL);
  const billingIds = targets.map((t) => t.id);
  const subPayments =
    billingIds.length > 0
      ? await database
          .select({ paymentId: tenantReading.paymentId })
          .from(tenantReading)
          .where(inArray(tenantReading.billingInfoId, billingIds))
      : [];
  const paymentIds = [...targets, ...subPayments]
    .map((row) => row.paymentId)
    .filter((id): id is string => !!id);

  const deleteBilling = database
    .delete(billingInfo)
    .where(whereSQL)
    .returning({ deletedId: billingInfo.id });
  const results = await database.batch(
    paymentIds.length > 0
      ? [deleteBilling, database.delete(payment).where(inArray(payment.id, paymentIds))]
      : [deleteBilling]
  );
  const deleteResult = results[0] as { deletedId: string }[];

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
