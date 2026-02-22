import { db } from "$/server/db";
import type { Transaction } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { passwordResetSession } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/server/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type {
  NewPasswordResetSession,
  PasswordResetSessionDTO,
} from "$/types/password-reset-session";
import { generateQueryConditions } from "$/server/mapper";

type PasswordResetSessionQueryOptions = {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { expiresAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addPasswordResetSession(
  data: Omit<NewPasswordResetSession, "id">[],
  tx?: Transaction
): Promise<HelperResult<NewPasswordResetSession[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 password reset session(s) added",
      value: [],
    };
  }

  const insert_result = await (tx || db())
    .insert(passwordResetSession)
    .values(
      data.map((session_data) => ({
        id: crypto.randomUUID(),
        ...session_data,
      }))
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
  const { query, options } = by;
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
  const conditions = generateQueryConditions<NewPasswordResetSession>(by);
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
  const conditions = generateQueryConditions<NewPasswordResetSession>(data);
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
  const queryDBResult = await (options?.tx || db()).query.passwordResetSession.findMany(
    queryOptions
  );

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
    expiresAt: _session.expiresAt ? new Date(_session.expiresAt) : new Date(),
    emailVerified: _session.emailVerified ?? false,
    twoFactorVerified: _session.twoFactorVerified ?? false,
  }));
}

export async function getPasswordResetSessionCountBy(
  data: HelperParam<NewPasswordResetSession>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const { id, email } = query;
  const conditions = generateQueryConditions<NewPasswordResetSession>(data);
  console.log({ conditions });
  const request_query = (options?.tx || db()).select({ count: count() }).from(passwordResetSession);

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

export async function deletePasswordResetSessionBy(
  data: HelperParam<NewPasswordResetSession>
): Promise<HelperResult<number>> {
  const { query, options } = data;
  const conditions = generateQueryConditions<NewPasswordResetSession>(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const deleteResult = await (options?.tx || db()).delete(passwordResetSession).where(whereSQL);

  const deletedCount = deleteResult.rowCount ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} password reset session(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
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
      conditions.push(eq(passwordResetSession.expiresAt, value as Date));
    } else if (key === "emailVerified") {
      conditions.push(eq(passwordResetSession.emailVerified, value as boolean));
    } else if (key === "twoFactorVerified") {
      conditions.push(eq(passwordResetSession.twoFactorVerified, value as boolean));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
