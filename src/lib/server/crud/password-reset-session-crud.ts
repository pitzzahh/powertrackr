import { db } from "#lib/server/db/index.js";
import { and, eq, not, type SQL } from "drizzle-orm";
import { passwordResetSession } from "#lib/server/db/schema/index.js";
import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import { getChangedData } from "#lib/utils/mapper.js";
import type { NewPasswordResetSession } from "#lib/types/auth.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

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

  const insert_result = await db()
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
  const updateDBRequest = await db()
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
  const queryDBResult = await db().query.passwordResetSession.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} password reset session(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

function buildWhereSQL(where: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      const notCondition = not(eq(passwordResetSession.id, notObj.id));
      if (notCondition) conditions.push(notCondition);
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
