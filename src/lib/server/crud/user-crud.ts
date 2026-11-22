import { db } from "#lib/server/db/index.js";
import { and, eq, inArray, not, or, type SQL } from "drizzle-orm";
import { billingInfo, payment, tenantReading, user } from "#lib/server/db/schema/index.js";
import type { HelperParam, HelperResult } from "#lib/types/helper.js";
import { generateNotFoundMessage } from "#lib/utils/text.js";
import { getChangedData } from "#lib/utils/mapper.js";
import type { NewUser } from "#lib/types/user.js";
import type { Session } from "#lib/types/session.js";
import type { UserDTOWithSessions } from "#lib/types/user.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

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

  const insert_result = await db()
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
  const conditions = generateQueryConditions<NewUser>(by);
  const changed_data = getChangedData(old_user, data);

  if (Object.keys(changed_data).length === 0) {
    return {
      valid: true,
      message: "No data changed",
      value: [old_user],
    };
  }

  const whereSQL = buildWhereSQL(conditions);
  const updateDBRequest = await db().update(user).set(changed_data).returning().where(whereSQL);

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
  const conditions = generateQueryConditions<NewUser>(data);
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
  const queryDBResult = await db().query.user.findMany(queryOptions);

  const is_valid = queryDBResult.length > 0;
  return {
    valid: is_valid,
    message: `${queryDBResult.length} user(s) ${is_valid ? "found" : `with ${generateNotFoundMessage(data.query)}`}`,
    value: queryDBResult,
  };
}

export function mapNewUser_to_DTO(
  data: Partial<NewUser & { sessions?: Session[] }>[]
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

export async function deleteUserBy(data: HelperParam<NewUser>): Promise<HelperResult<number>> {
  const { query } = data;
  const conditions = generateQueryConditions<NewUser>(data);
  const whereSQL = buildWhereSQL(conditions);

  if (!whereSQL) {
    return {
      valid: false,
      message: "No conditions provided for deletion",
      value: 0,
    };
  }

  const database = db();
  // Payments are referenced by billing_info/tenant_reading, not the other way
  // round, so the user cascade leaves them behind. Collect them (the user's
  // bills, every reading on those bills, the user's own tenant readings) and
  // delete them in the same batch.
  const userIds = (await database.select({ id: user.id }).from(user).where(whereSQL)).map(
    (u) => u.id
  );
  const paymentIds =
    userIds.length > 0
      ? [
          ...(await database
            .select({ paymentId: billingInfo.paymentId })
            .from(billingInfo)
            .where(inArray(billingInfo.userId, userIds))),
          ...(await database
            .select({ paymentId: tenantReading.paymentId })
            .from(tenantReading)
            .leftJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
            .where(
              or(inArray(tenantReading.tenantUserId, userIds), inArray(billingInfo.userId, userIds))
            )),
        ]
          .map((row) => row.paymentId)
          .filter((id): id is string => !!id)
      : [];

  const deleteUsers = database.delete(user).where(whereSQL).returning({ deletedId: user.id });
  const results = await database.batch(
    paymentIds.length > 0
      ? [deleteUsers, database.delete(payment).where(inArray(payment.id, paymentIds))]
      : [deleteUsers]
  );
  const deleteResult = results[0] as { deletedId: string }[];

  const deletedCount = deleteResult.length ?? 0;
  const is_valid = deletedCount > 0;
  return {
    valid: is_valid,
    message: `${deletedCount} user(s) ${is_valid ? "deleted" : `not deleted with ${generateNotFoundMessage(query)}`}`,
    value: deletedCount,
  };
}

function buildWhereSQL(where: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      const notObj = value as { id: string };
      const notCondition = not(eq(user.id, notObj.id));
      if (notCondition) conditions.push(notCondition);
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
