import { db } from "$/server/db";
import { and, asc, count, desc, eq, not, type SQLWrapper } from "drizzle-orm";
import { user } from "$/server/db/schema";
import type { HelperParam, HelperResult } from "$/types/helper";
import { generateNotFoundMessage } from "$/utils/text";
import { getChangedData } from "$/utils/mapper";
import type { NewUser, User, UserDTO, UserDTOWithSessions } from "$/types/user";

export async function addUser(
  data: Omit<NewUser, "id">[],
): Promise<HelperResult<NewUser[]>> {
  const insert_result = await db
    .insert(user)
    .values(
      data.map((user_data) => {
        return {
          id: crypto.randomUUID(),
          ...user_data,
        };
      }),
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
  data: Partial<NewUser>,
): Promise<HelperResult<NewUser[]>> {
  const { query } = by;
  const user_result = await getUserBy(by);

  if (!user_result.valid || !user_result.value) {
    return {
      valid: user_result.valid,
      message: user_result.message,
    };
  }

  const [old_user] = user_result.value;
  const conditions = generateUserQueryConditions(by);
  const changed_data = getChangedData(old_user, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_user],
    };
  }

  const updateDBRequest = await db
    .update(user)
    .set(changed_data)
    .returning()
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const is_valid = conditions !== undefined && updateDBRequest.length > 0;
  return {
    valid: is_valid,
    message: `${updateDBRequest.length} user(s) ${is_valid ? "updated" : `not updated with ${generateNotFoundMessage(query)}`}`,
    value: updateDBRequest,
  };
}

export async function getUserBy(
  data: HelperParam<NewUser>,
): Promise<HelperResult<NewUser[] | UserDTOWithSessions[]>> {
  const { query, options } = data;
  const { limit, offset, order, with_session } = options;
  const conditions = generateUserQueryConditions(data);
  const queryDBResult = (await db.query.user.findMany({
    with:
      with_session === true
        ? {
            sessions: true,
          }
        : undefined,
    where: conditions.length > 0 ? and(...conditions) : undefined,
    limit,
    offset,
    orderBy:
      order === "asc"
        ? asc(user.createdAt)
        : order === "desc"
          ? desc(user.createdAt)
          : undefined,
  })) as NewUser[] | UserDTOWithSessions[];

  const mappedData = queryDBResult.map((user) => ({
    ...user,
  }));
  const is_valid = mappedData.length > 0;
  return {
    valid: is_valid,
    message: `${mappedData.length} user(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(query)}`}`,
    value: mappedData,
  };
}

export async function getUsers(data: HelperParam<NewUser>): Promise<UserDTO[]> {
  const usersResult = await getUserBy(data);
  return !usersResult.valid || !usersResult.value
    ? []
    : mapNewUser_to_DTO(usersResult.value);
}

export async function mapNewUser_to_DTO(
  data: NewUser[] | UserDTOWithSessions[],
): Promise<UserDTO[]> {
  return Promise.all(
    data.map(async (_user) => {
      const user_info = {
        id: _user.id,
        githubId: _user.githubId,
        name: _user.name,
        email: _user.email,
        emailVerified: _user.emailVerified,
        registeredTwoFactor: _user.registeredTwoFactor,
        image: _user.image,
        createdAt: _user.createdAt,
        updatedAt: _user.updatedAt,
      } as UserDTO;

      if ("sessions" in _user) {
        return {
          ...user_info,
          sessions: _user.sessions,
        } as UserDTO;
      }
      return user_info;
    }),
  );
}

export async function getUserCountBy(
  data: HelperParam<NewUser>,
): Promise<HelperResult<number>> {
  const { query } = data;
  const { id, email } = query;
  const conditions = generateUserQueryConditions(data);
  const request_query = db.select({ count: count() }).from(user);

  if (id || email) {
    request_query.limit(1);
  }

  const [_data] = await request_query.where(
    conditions.length > 0 ? and(...conditions) : undefined,
  );

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

export function generateUserQueryConditions(data: HelperParam<User>) {
  const { query, options } = data;
  const { id, name, email, registeredTwoFactor, emailVerified } = query;
  const { exclude_id } = options;
  const conditions: SQLWrapper[] = [];

  if (id) conditions.push(eq(user.id, id));
  if (name) conditions.push(eq(user.name, name));
  if (email) conditions.push(eq(user.email, email));
  if (registeredTwoFactor)
    conditions.push(eq(user.registeredTwoFactor, registeredTwoFactor));
  if (emailVerified) conditions.push(eq(user.emailVerified, emailVerified));

  if (exclude_id) {
    conditions.push(not(eq(user.id, exclude_id)));
  }

  return conditions;
}
