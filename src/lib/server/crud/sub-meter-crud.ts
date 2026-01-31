import { db } from "$/server/db";
import type { Transaction } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { subMeter } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type {
  NewSubMeter,
  SubMeter,
  SubMeterDTO,
  SubMeterDTOWithPayment,
  SubMeterDTOWithBillingInfo,
  Payment,
  BillingInfo,
} from "$lib/types/sub-meter";

type SubMeterQueryOptions = {
  with?: { payment?: true; billingInfo?: true };
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addSubMeter(
  data: Omit<NewSubMeter, "id">[],
  tx?: Transaction
): Promise<HelperResult<NewSubMeter[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 sub meter(s) added",
      value: [],
    };
  }

  const insert_result = await (tx || db())
    .insert(subMeter)
    .values(
      data.map((sub_meter_data) => {
        return {
          id: crypto.randomUUID(),
          ...sub_meter_data,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} sub meter(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateSubMeterBy(
  by: HelperParam<NewSubMeter>,
  data: Partial<NewSubMeter>
): Promise<HelperResult<NewSubMeter[]>> {
  const { query } = by;
  const sub_meter_param = {
    ...by,
    options: { ...by.options, fields: undefined },
  };
  const sub_meter_result = await getSubMeterBy(sub_meter_param);

  if (!sub_meter_result.valid || !sub_meter_result.value) {
    return {
      valid: sub_meter_result.valid,
      message: sub_meter_result.message,
      value: [],
    };
  }

  const [old_sub_meter] = sub_meter_result.value as NewSubMeter[];
  const conditions = generateSubMeterQueryConditions(by);
  const changed_data = getChangedData(old_sub_meter, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_sub_meter],
    };
  }

  // If subReadingLatest is updated, keep the `reading` field in sync unless
  // `reading` itself was explicitly provided.
  if (
    Object.prototype.hasOwnProperty.call(changed_data, "subReadingLatest") &&
    !Object.prototype.hasOwnProperty.call(changed_data, "reading")
  ) {
    (changed_data as any).reading = (changed_data as any).subReadingLatest;
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await (by.options?.tx || db())
    .update(subMeter)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} sub meter(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getSubMeterBy(
  data: HelperParam<NewSubMeter>
): Promise<
  HelperResult<Partial<NewSubMeter & { payment?: Payment | null; billingInfo?: BillingInfo }>[]>
> {
  const { options } = data;
  const conditions = generateSubMeterQueryConditions(data);
  const queryOptions: SubMeterQueryOptions = {
    with: {
      ...(options && options.with_payment ? { payment: true } : {}),
      ...(options && options.with_billing_info ? { billingInfo: true } : {}),
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
  const queryDBResult = await (options?.tx || db()).query.subMeter.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} sub meter(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getSubMeters(
  data: HelperParam<NewSubMeter>
): Promise<Partial<SubMeterDTO>[]> {
  const subMetersResult = await getSubMeterBy(data);
  return !subMetersResult.valid || !subMetersResult.value
    ? []
    : mapNewSubMeter_to_DTO(subMetersResult.value);
}

export async function mapNewSubMeter_to_DTO(
  data: Partial<
    NewSubMeter & {
      subKwh?: number | null;
      subkWh?: number | null;
      payment?: Payment | null;
      billingInfo?: BillingInfo;
    }
  >[]
): Promise<Partial<SubMeterDTO>[]> {
  return Promise.all(
    data.map(async (_sub_meter) => {
      const sub_meter_info = {
        id: _sub_meter.id,
        billingInfoId: _sub_meter.billingInfoId,
        // Handle both possible key variants and normalize to DTO `subKwh` while preserving undefined
        subkWh: Object.prototype.hasOwnProperty.call(_sub_meter, "subKwh")
          ? (_sub_meter as any).subKwh
          : Object.prototype.hasOwnProperty.call(_sub_meter, "subkWh")
            ? (_sub_meter as any).subkWh
            : undefined,
        label: Object.prototype.hasOwnProperty.call(_sub_meter, "label")
          ? (_sub_meter as any).label
          : undefined,
        // Include the `reading` field in DTO (preserve undefined/null as provided)
        reading: Object.prototype.hasOwnProperty.call(_sub_meter, "reading")
          ? (_sub_meter as any).reading
          : undefined,
        paymentId: Object.prototype.hasOwnProperty.call(_sub_meter, "paymentId")
          ? (_sub_meter as any).paymentId
          : undefined,
        createdAt: _sub_meter.createdAt ? new Date(_sub_meter.createdAt) : null,
        updatedAt: _sub_meter.updatedAt ? new Date(_sub_meter.updatedAt) : null,
      } as SubMeterDTO;

      if ("payment" in _sub_meter) {
        return {
          ...sub_meter_info,
          payment: _sub_meter.payment,
        } as SubMeterDTOWithPayment;
      }
      if ("billingInfo" in _sub_meter) {
        return {
          ...sub_meter_info,
          billingInfo: _sub_meter.billingInfo,
        } as SubMeterDTOWithBillingInfo;
      }
      return sub_meter_info;
    })
  );
}

export async function getSubMeterCountBy(
  data: HelperParam<NewSubMeter>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, billingInfoId } = query;
  const conditions = generateSubMeterQueryConditions(data);
  const request_query = (data.options?.tx || db()).select({ count: count() }).from(subMeter);

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
      ? `Sub meter(s) count is ${_count}`
      : `Sub meter(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export async function deleteSubMeterBy(
  data: HelperParam<NewSubMeter>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const conditions = generateSubMeterQueryConditions(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await (options?.tx || db()).delete(subMeter).where(whereSQL);

  const deletedCount = deleteResult.rowCount ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} sub meter(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
}

export function generateSubMeterQueryConditions(data: HelperParam<SubMeter>) {
  const { query, options } = data;
  const { id, billingInfoId, subkWh, paymentId, reading } = query;

  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (billingInfoId) where.billingInfoId = billingInfoId;
  if (subkWh !== undefined) where.subkWh = subkWh;
  if (paymentId) where.paymentId = paymentId;
  if (reading !== undefined) where.reading = reading;

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
      conditions.push(not(eq(subMeter.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(subMeter.id, value as string));
    } else if (key === "billingInfoId") {
      conditions.push(eq(subMeter.billingInfoId, value as string));
    } else if (key === "subkWh") {
      conditions.push(eq(subMeter.subkWh, value as number));
    } else if (key === "reading") {
      conditions.push(eq(subMeter.reading, value as number));
    } else if (key === "paymentId") {
      conditions.push(eq(subMeter.paymentId, value as string));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
