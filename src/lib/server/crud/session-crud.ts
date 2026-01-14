import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { session } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewSession, SessionDTO } from "$/types/session";

type SessionQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { expiresAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addSession(
  data: Omit<NewSession, "id">[]
): Promise<HelperResult<NewSession[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 session(s) added",
      value: [],
    };
  }

  const insert_result = await db
    .insert(session)
    .values(
      data.map((session_data) => {
        return {
          id: crypto.randomUUID(),
          ...session_data,
        };
      })
    )
    .returning();

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
): Promise<HelperResult<NewSession[]>> {
  const { query } = by;
  const session_param = { ...by, options: { ...by.options, fields: undefined } };
  const session_result = await getSessionBy(session_param);

  if (!session_result.valid || !session_result.value) {
    return {
      valid: session_result.valid,
      message: session_result.message,
      value: [],
    };
  }

  const [old_session] = session_result.value as NewSession[];
  const conditions = generateSessionQueryConditions(by);
  const changed_data = getChangedData(old_session, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_session],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db.update(session).set(changed_data).returning().where(whereSQL);

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
  const { limit, offset, order, fields } = options;
  const conditions = generateSessionQueryConditions(data);
  const queryOptions: SessionQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    limit,
    offset,
    orderBy: order ? { expiresAt: order as "asc" | "desc" } : undefined,
  };
  if (fields && fields.length > 0) {
    queryOptions.columns = fields.reduce((acc, key) => ({ ...acc, [key as string]: true }), {});
  }
  const queryDBResult = await db.query.session.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} session(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getSessions(data: HelperParam<NewSession>): Promise<SessionDTO[]> {
  const sessionsResult = await getSessionBy(data);
  return !sessionsResult.valid || !sessionsResult.value
    ? []
    : mapNewSession_to_DTO(sessionsResult.value);
}

export async function mapNewSession_to_DTO(data: Partial<NewSession>[]): Promise<SessionDTO[]> {
  return data.map((_session) => {
    // Normalize expiresAt to a Date instance for the DTO regardless of how it
    // was stored in the DB (string/number/date). This keeps the DTO stable
    // and avoids flaky assertions in tests.
    const raw = (_session.expiresAt as unknown) ?? new Date();
    let expiresAt: Date;
    if (typeof raw === "string" || typeof raw === "number") {
      expiresAt = new Date(raw as any);
    } else if (raw instanceof Date) {
      expiresAt = raw;
    } else {
      expiresAt = new Date();
    }

    return {
      id: _session.id ?? "",
      expiresAt,
      ipAddress: _session.ipAddress ?? null,
      userAgent: _session.userAgent ?? null,
      userId: _session.userId ?? "",
      twoFactorVerified: _session.twoFactorVerified ?? false,
    } as SessionDTO;
  });
}

export async function getSessionCountBy(
  data: HelperParam<NewSession>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, userId } = query;
  const conditions = generateSessionQueryConditions(data);
  const request_query = db.select({ count: count() }).from(session);

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

export function generateSessionQueryConditions(data: HelperParam<NewSession>) {
  const { query, options } = data;
  const { id, expiresAt, ipAddress, userAgent, userId, twoFactorVerified } = query;
  const { exclude_id } = options;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (expiresAt) where.expiresAt = expiresAt;
  if (ipAddress) where.ipAddress = ipAddress;
  if (userAgent) where.userAgent = userAgent;
  if (userId) where.userId = userId;
  if (twoFactorVerified !== undefined) where.twoFactorVerified = twoFactorVerified;

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
      conditions.push(not(eq(session.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(session.id, value as string));
    } else if (key === "expiresAt") {
      // Accept string | number | Date and normalize to an ISO 8601 string for comparison.
      const raw = value as unknown;
      let normalizedIso: string;
      if (typeof raw === "number") {
        const num = raw as number;
        const ms = num < 1_000_000_000_000 ? num * 1000 : num;
        normalizedIso = new Date(ms).toISOString();
      } else if (typeof raw === "string") {
        normalizedIso = raw;
      } else if (raw instanceof Date) {
        normalizedIso = (raw as Date).toISOString();
      } else {
        normalizedIso = new Date().toISOString();
      }
      conditions.push(eq(session.expiresAt, normalizedIso));
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
