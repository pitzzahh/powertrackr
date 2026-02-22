import { db } from "$/server/db";
import type { Transaction } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { session } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewSession, Session, SessionDTO } from "$/types/session";
import { generateQueryConditions } from "$/server/mapper";

type SessionQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { expiresAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addSession(
  data: NewSession[],
  tx?: Transaction
): Promise<HelperResult<Session[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 session(s) added",
      value: [],
    };
  }

  const insert_result = await (tx || db()).insert(session).values(data).returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} session(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateSessionBy(
  by: HelperParam<NewSession>,
  data: Partial<NewSession>
): Promise<HelperResult<Session[]>> {
  const { query, options } = by;
  const session_param = { ...by, options: { ...by.options, fields: undefined } };
  const session_result = await getSessionBy(session_param);

  if (!session_result.valid || !session_result.value) {
    return {
      valid: session_result.valid,
      message: session_result.message,
      value: [],
    };
  }

  const [old_session] = session_result.value as Session[];
  const conditions = generateQueryConditions<NewSession>(by);
  const changed_data = getChangedData(old_session, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_session],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await (options?.tx || db())
    .update(session)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} session(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getSessionBy(
  data: HelperParam<NewSession>
): Promise<HelperResult<Partial<NewSession>[]>> {
  const { options } = data;
  const conditions = generateQueryConditions<NewSession>(data);
  const queryOptions: SessionQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    ...(options && {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.order ? { expiresAt: options.order } : undefined,
    }),
  };
  if (options && options.fields && options.fields.length > 0) {
    queryOptions.columns = options.fields.reduce(
      (acc, key) => ({ ...acc, [key as string]: true }),
      {}
    );
  }
  const queryDBResult = await (options?.tx || db()).query.session.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} session(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getSessions(data: HelperParam<NewSession>): Promise<Partial<SessionDTO>[]> {
  const sessionsResult = await getSessionBy(data);
  return mapNewSession_to_DTO(sessionsResult.value);
}

export async function mapNewSession_to_DTO(
  data: Partial<NewSession>[]
): Promise<Partial<SessionDTO>[]> {
  return data.map((_session) => ({
    id: _session.id,
    expiresAt: _session.expiresAt,
    ipAddress: _session.ipAddress,
    userAgent: _session.userAgent,
    userId: _session.userId,
    twoFactorVerified: _session.twoFactorVerified,
  }));
}

export async function getSessionCountBy(
  data: HelperParam<NewSession>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, userId } = query;
  const conditions = generateQueryConditions<NewSession>(data);
  const request_query = (data.options?.tx || db()).select({ count: count() }).from(session);

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
      ? `Session(s) count is ${_count}`
      : `Session(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export async function deleteSessionBy(
  data: HelperParam<NewSession>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const conditions = generateQueryConditions<NewSession>(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await (options?.tx || db()).delete(session).where(whereSQL);

  const deletedCount = deleteResult.rowCount ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} session(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
}

function buildWhereSQL(where: Record<keyof Session, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      conditions.push(not(eq(session.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(session.id, value as string));
    } else if (key === "expiresAt") {
      conditions.push(eq(session.expiresAt, value as Date));
    } else if (key === "ipAddress") {
      conditions.push(eq(session.ipAddress, value as string));
    } else if (key === "userAgent") {
      conditions.push(eq(session.userAgent, value as string));
    } else if (key === "userId") {
      conditions.push(eq(session.userId, value as string));
    } else if (key === "twoFactorVerified") {
      conditions.push(eq(session.twoFactorVerified, value as boolean));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
