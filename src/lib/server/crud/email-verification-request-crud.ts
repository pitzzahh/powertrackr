import { db } from "#lib/server/db/index.js";
import { and, eq, not, type SQL } from "drizzle-orm";
import { emailVerificationRequest } from "#lib/server/db/schema/index.js";
import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import { getChangedData } from "#lib/utils/mapper.js";
import type { EmailVerificationRequest, NewEmailVerificationRequest } from "#lib/types/auth.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

type EmailVerificationRequestQueryOptions = {
  with?: { user: true };
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { expiresAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addEmailVerificationRequest(
  data: Omit<NewEmailVerificationRequest, "id">[]
): Promise<HelperResult<NewEmailVerificationRequest[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 email verification request(s) added",
      value: [],
    };
  }

  const insert_result = await db()
    .insert(emailVerificationRequest)
    .values(
      data.map((request_data) => ({
        id: crypto.randomUUID(),
        ...request_data,
      }))
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} email verification request(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateEmailVerificationRequestBy(
  by: HelperParam<NewEmailVerificationRequest>,
  data: Partial<NewEmailVerificationRequest>
): Promise<HelperResult<EmailVerificationRequest[]>> {
  const { query } = by;
  const request_param = { ...by, options: { ...by.options, fields: undefined } };
  const request_result = await getEmailVerificationRequestBy(request_param);

  if (!request_result.valid || !request_result.value) {
    return {
      valid: request_result.valid,
      message: request_result.message,
      value: [],
    };
  }

  const [old_request] = request_result.value as NewEmailVerificationRequest[];
  const conditions = generateQueryConditions<NewEmailVerificationRequest>(by);
  const changed_data = getChangedData(old_request, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_request],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db()
    .update(emailVerificationRequest)
    .set(changed_data)
    .returning()
    .where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} email verification request(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getEmailVerificationRequestBy(
  data: HelperParam<NewEmailVerificationRequest>
): Promise<HelperResult<Partial<EmailVerificationRequest>[]>> {
  const { options } = data;
  const conditions = generateQueryConditions<NewEmailVerificationRequest>(data);
  const queryOptions: EmailVerificationRequestQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    ...(options && {
      with: options.with_user ? { user: true } : undefined,
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
  const queryDBResult = await db().query.emailVerificationRequest.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} email verification request(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

function buildWhereSQL(where: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      const notCondition = not(eq(emailVerificationRequest.id, notObj.id));
      if (notCondition) conditions.push(notCondition);
    } else if (key === "id") {
      conditions.push(eq(emailVerificationRequest.id, value as string));
    } else if (key === "userId") {
      conditions.push(eq(emailVerificationRequest.userId, value as string));
    } else if (key === "email") {
      conditions.push(eq(emailVerificationRequest.email, value as string));
    } else if (key === "code") {
      conditions.push(eq(emailVerificationRequest.code, value as string));
    } else if (key === "expiresAt") {
      conditions.push(eq(emailVerificationRequest.expiresAt, value as Date));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
