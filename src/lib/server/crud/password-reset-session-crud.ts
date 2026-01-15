import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { passwordResetSession } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type {
  NewPasswordResetSession,
  PasswordResetSessionDTO,
} from "$/types/password-reset-session";

type PasswordResetSessionQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { expiresAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addPasswordResetSession(
  data: Omit<NewPasswordResetSession, "id">[]
): Promise<HelperResult<NewPasswordResetSession[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 password reset session(s) added",
      value: [],
    };
  }

  const insert_result = await db
    .insert(passwordResetSession)
    .values(
      data.map((session_data) => {
        // Normalize expiresAt to an ISO 8601 string (TEXT) so callers may pass
        // a number (seconds or ms), a Date, or a string and the DB will keep a
        // consistent string representation.
        const normalized = { ...session_data } as any;
        if (normalized.expiresAt !== undefined) {
          const raw = normalized.expiresAt;
          if (typeof raw === "number") {
            normalized.expiresAt =
              raw < 1_000_000_000_000
                ? new Date(raw * 1000).toISOString()
                : new Date(raw).toISOString();
          } else if (raw instanceof Date) {
            normalized.expiresAt = raw.toISOString();
          } else {
            normalized.expiresAt = String(raw);
          }
        }
        return {
          id: crypto.randomUUID(),
          ...normalized,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} password reset session(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updatePasswordResetSessionBy(
  by: HelperParam<NewPasswordResetSession>,
  data: Partial<NewPasswordResetSession>
): Promise<HelperResult<NewPasswordResetSession[]>> {
  const { query } = by;
  const session_param = { ...by, options: { ...by.options, fields: undefined } };
  const session_result = await getPasswordResetSessionBy(session_param);

  if (!session_result.valid || !session_result.value) {
    return {
      valid: session_result.valid,
      message: session_result.message,
      value: [],
    };
  }

  const [old_session] = session_result.value as NewPasswordResetSession[];
  const conditions = generatePasswordResetSessionQueryConditions(by);
  const changed_data = getChangedData(old_session, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_session],
    };
  }

  // Normalize any expiresAt update to an ISO 8601 string
  if ("expiresAt" in changed_data && changed_data.expiresAt !== undefined) {
    const raw = changed_data.expiresAt as unknown;
    if (typeof raw === "number") {
      changed_data.expiresAt =
        (raw as number) < 1_000_000_000_000
          ? new Date((raw as number) * 1000).toISOString()
          : new Date(raw as number).toISOString();
    } else if (raw instanceof Date) {
      changed_data.expiresAt = raw.toISOString();
    } else {
      // assume it's already a string
      changed_data.expiresAt = raw as any;
    }
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db
    .update(passwordResetSession)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} password reset session(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getPasswordResetSessionBy(
  data: HelperParam<NewPasswordResetSession>
): Promise<HelperResult<Partial<NewPasswordResetSession>[]>> {
  const { options } = data;
  const conditions = generatePasswordResetSessionQueryConditions(data);
  const queryOptions: PasswordResetSessionQueryOptions = {
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
  const queryDBResult = await db.query.passwordResetSession.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} password reset session(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getPasswordResetSessions(
  data: HelperParam<NewPasswordResetSession>
): Promise<PasswordResetSessionDTO[]> {
  const sessionsResult = await getPasswordResetSessionBy(data);
  return !sessionsResult.valid || !sessionsResult.value
    ? []
    : mapNewPasswordResetSession_to_DTO(sessionsResult.value);
}

export async function mapNewPasswordResetSession_to_DTO(
  data: Partial<NewPasswordResetSession>[]
): Promise<PasswordResetSessionDTO[]> {
  return data.map((_session) => ({
    id: _session.id ?? "",
    userId: _session.userId ?? "",
    email: _session.email ?? "",
    code: _session.code ?? "",
    // expiresAt is stored as an ISO 8601 string (TEXT)
    expiresAt: _session.expiresAt ?? "",
    emailVerified: _session.emailVerified ?? false,
    twoFactorVerified: _session.twoFactorVerified ?? false,
  }));
}

export async function getPasswordResetSessionCountBy(
  data: HelperParam<NewPasswordResetSession>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, email } = query;
  const conditions = generatePasswordResetSessionQueryConditions(data);
  const request_query = db.select({ count: count() }).from(passwordResetSession);

  if (id || email) {
    request_query.limit(1);
  }

  const whereSQL = buildWhereSQL(conditions);
  const [_data] = await request_query.where(whereSQL);

  const _count = _data?.count;
  const is_valid = _count > 0;
  return {
    valid: is_valid,
    message: is_valid
      ? `Password reset session(s) count is ${_count}`
      : `Password reset session(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export function generatePasswordResetSessionQueryConditions(
  data: HelperParam<NewPasswordResetSession>
) {
  const { query, options } = data;
  const { id, userId, email, code, expiresAt, emailVerified, twoFactorVerified } = query;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (userId) where.userId = userId;
  if (email) where.email = email;
  if (code) where.code = code;
  if (expiresAt) where.expiresAt = expiresAt;
  if (emailVerified !== undefined) where.emailVerified = emailVerified;
  if (twoFactorVerified !== undefined) where.twoFactorVerified = twoFactorVerified;

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
      conditions.push(not(eq(passwordResetSession.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(passwordResetSession.id, value as string));
    } else if (key === "userId") {
      conditions.push(eq(passwordResetSession.userId, value as string));
    } else if (key === "email") {
      conditions.push(eq(passwordResetSession.email, value as string));
    } else if (key === "code") {
      conditions.push(eq(passwordResetSession.code, value as string));
    } else if (key === "expiresAt") {
      // Accept either a string (ISO) or number (seconds/ms) for convenience,
      // normalizing numeric values to an ISO 8601 string before comparison.
      if (typeof value === "number") {
        const num = value as number;
        const normalized =
          num < 1_000_000_000_000
            ? new Date(num * 1000).toISOString()
            : new Date(num).toISOString();
        conditions.push(eq(passwordResetSession.expiresAt, normalized));
      } else {
        conditions.push(eq(passwordResetSession.expiresAt, value as string));
      }
    } else if (key === "emailVerified") {
      conditions.push(eq(passwordResetSession.emailVerified, value as boolean));
    } else if (key === "twoFactorVerified") {
      conditions.push(eq(passwordResetSession.twoFactorVerified, value as boolean));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
