import { db } from "$/server/db";
import { and, count, eq, not, type SQL } from "drizzle-orm";
import { user } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewUser, NewUserWitSessions, UserDTOWithSessions } from "$/types/user";

type UserQueryOptions = {
  with?: { sessions: true };
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: { createdAt: "asc" | "desc" };
  columns?: Record<string, true>;
};

export async function addUser(data: Omit<NewUser, "id">[]): Promise<HelperResult<NewUser[]>> {
  if (data.length === 0) {
    return {
      valid: true,
      message: "0 user(s) added",
      value: [],
    };
  }

  const insert_result = await db
    .insert(user)
    .values(
      data.map((user_data) => {
        return {
          id: crypto.randomUUID(),
          ...user_data,
        };
      })
    )
    .returning();

  const is_valid = insert_result.length === data.length;
  return {
    valid: is_valid,
    message: `${insert_result.length} user(s) ${is_valid ? "added" : "not added"}`,
    value: insert_result,
  };
}

export async function updateUserBy(
  by: HelperParam<NewUser>,
  data: Partial<NewUser>
): Promise<HelperResult<NewUser[]>> {
  const { query } = by;
  const user_param = { ...by, options: { ...by.options, fields: undefined } };
  const user_result = await getUserBy(user_param);

  if (!user_result.valid || !user_result.value) {
    return {
      valid: user_result.valid,
      message: user_result.message,
      value: [],
    };
  }

  const [old_user] = user_result.value as NewUser[];
  const conditions = generateUserQueryConditions(by);
  const changed_data = getChangedData(old_user, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_user],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db.update(user).set(changed_data).returning().where(whereSQL);

  const is_valid = Object.keys(conditions).length > 0 && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} user(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getUserBy(
  data: HelperParam<NewUser>
): Promise<HelperResult<Partial<NewUser>[]>> {
  const { options } = data;
  const conditions = generateUserQueryConditions(data);
  const queryOptions: UserQueryOptions = {
    where: Object.keys(conditions).length > 0 ? conditions : undefined,
    ...(options && {
      with: options.with_session ? { sessions: true } : undefined,
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
  const queryDBResult = await db.query.user.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} user(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export async function getUsers(data: HelperParam<NewUser>): Promise<Partial<NewUser>[]> {
  const usersResult = await getUserBy(data);
  return !usersResult.valid || !usersResult.value ? [] : mapNewUser_to_DTO(usersResult.value);
}

export function mapNewUser_to_DTO(
  data: Partial<NewUserWitSessions>[]
): Partial<UserDTOWithSessions>[] {
  return data.map((_user) => ({
    id: _user.id,
    githubId: _user.githubId,
    name: _user.name,
    email: _user.email,
    emailVerified: _user.emailVerified,
    registeredTwoFactor: _user.registeredTwoFactor,
    image: _user.image,
    createdAt: _user.createdAt,
    updatedAt: _user.updatedAt,
    sessions: _user.sessions,
  }));
}

export async function getUserCountBy(data: HelperParam<NewUser>): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, email } = query;
  const conditions = generateUserQueryConditions(data);
  const request_query = db.select({ count: count() }).from(user);

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
      ? `User(s) count is ${_count}`
      : `User(s) count with ${generateNotFoundMessage(query)}`,
    value: _count,
  };
}

export function generateUserQueryConditions(data: HelperParam<NewUser>) {
  const { query, options } = data;
  const { id, githubId, name, email, registeredTwoFactor, emailVerified } = query;
  const where: Record<string, unknown> = {};

  if (id) where.id = id;
  if (githubId !== undefined) where.githubId = githubId;
  if (name) where.name = name;
  if (email) where.email = email;
  if (registeredTwoFactor !== undefined) where.registeredTwoFactor = registeredTwoFactor;
  if (emailVerified !== undefined) where.emailVerified = emailVerified;

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
      conditions.push(not(eq(user.id, notObj.id)));
    } else if (key === "id") {
      conditions.push(eq(user.id, value as string));
    } else if (key === "githubId") {
      conditions.push(eq(user.githubId, value as number));
    } else if (key === "name") {
      conditions.push(eq(user.name, value as string));
    } else if (key === "email") {
      conditions.push(eq(user.email, value as string));
    } else if (key === "registeredTwoFactor") {
      conditions.push(eq(user.registeredTwoFactor, value as boolean));
    } else if (key === "emailVerified") {
      conditions.push(eq(user.emailVerified, value as boolean));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
