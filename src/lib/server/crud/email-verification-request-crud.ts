import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { emailVerificationRequest } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type {
  NewEmailVerificationRequest,
  EmailVerificationRequestDTO,
  NewEmailVerificationRequestWithUser,
} from "$/types/email-verification-request";
import { mapNewUser_to_DTO } from "./user-crud";
import type { UserDTO } from "$/types/user";

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

  const insert_result = await db
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
): Promise<HelperResult<NewEmailVerificationRequest[]>> {
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
  const conditions = generateEmailVerificationRequestQueryConditions(by);
  const changed_data = getChangedData(old_request, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_request],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db
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
): Promise<HelperResult<Partial<NewEmailVerificationRequest>[]>> {
  const { options } = data;
  const conditions = generateEmailVerificationRequestQueryConditions(data);
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
  const queryDBResult = await db.query.emailVerificationRequest.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} email verification request(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getEmailVerificationRequests(
  data: HelperParam<NewEmailVerificationRequest>
): Promise<Partial<EmailVerificationRequestDTO>[]> {
  const requestsResult = await getEmailVerificationRequestBy(data);
  return !requestsResult.valid || !requestsResult.value
    ? []
    : mapNewEmailVerificationRequest_to_DTO(requestsResult.value);
}

export async function mapNewEmailVerificationRequest_to_DTO(
  data: Partial<NewEmailVerificationRequestWithUser>[]
): Promise<Partial<EmailVerificationRequestDTO>[]> {
  return data.map((_request) => ({
    id: _request.id,
    userId: _request.userId,
    email: _request.email,
    code: _request.code,
    // Normalize expiresAt into a native Date (supports Date/Timestamp from Postgres)
    expiresAt: _request.expiresAt,
    ...(_request.user && {
      user: mapNewUser_to_DTO([_request.user])[0] as UserDTO,
    }),
  }));
}

export async function getEmailVerificationRequestCountBy(
  data: HelperParam<NewEmailVerificationRequest>
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, email } = query;
  const conditions = generateEmailVerificationRequestQueryConditions(data);
  const request_query = db.select({ count: count() }).from(emailVerificationRequest);

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
      ? `Email verification request(s) count is ${_count}`
      : `Email verification request(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export function generateEmailVerificationRequestQueryConditions(
  data: HelperParam<NewEmailVerificationRequest>
) {
  const { query, options } = data;
  const { id, userId, email, code, expiresAt } = query;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (userId) where.userId = userId;
  if (email) where.email = email;
  if (code) where.code = code;
  if (expiresAt) where.expiresAt = expiresAt;

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
      conditions.push(not(eq(emailVerificationRequest.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(emailVerificationRequest.id, value as string));
    } else if (key === "userId") {
      conditions.push(eq(emailVerificationRequest.userId, value as string));
    } else if (key === "email") {
      conditions.push(eq(emailVerificationRequest.email, value as string));
    } else if (key === "code") {
      conditions.push(eq(emailVerificationRequest.code, value as string));
    } else if (key === "expiresAt") {
      // Expect the caller to provide a Date (Postgres TIMESTAMPTZ). Do not
      // perform string/number normalization here.
      conditions.push(eq(emailVerificationRequest.expiresAt, value as Date));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
