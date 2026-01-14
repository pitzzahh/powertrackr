import { query, form, command } from "$app/server";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db/index";
import { session } from "$lib/server/db/schema/session";
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsSchema,
  getSessionSchema,
  deleteSessionSchema,
} from "$lib/schemas/session";

// Query to get all sessions for a user
export const getSessions = query(getSessionsSchema, async ({ userId }) => {
  return await db.query.session.findMany({ where: { userId } });
});

// Query to get a single session by id
export const getSession = query(getSessionSchema, async (id) => {
  return await db.query.session.findFirst({ where: { id } });
});

// Form to create a new session
export const createSession = form(createSessionSchema, async (data) => {
  const id = crypto.randomUUID();
  // Ensure `expiresAt` is stored as an ISO string in the DB. The schema
  // transformations may have already converted the incoming value to a
  // Date, so handle Date | number | string input forms robustly.
  const insertData = {
    id,
    ...data,
    expiresAt:
      typeof data.expiresAt === "string"
        ? data.expiresAt
        : typeof data.expiresAt === "number"
          ? (data.expiresAt as number) < 0xe8d4a51000
            ? new Date((data.expiresAt as number) * 1e3).toISOString()
            : new Date(data.expiresAt as number).toISOString()
          : data.expiresAt instanceof Date
            ? data.expiresAt.toISOString()
            : String((data as any).expiresAt),
  };

  const result = await db
    .insert(session)
    .values(insertData as any)
    .returning();
  return result[0];
});

// Form to update an existing session
export const updateSession = form(updateSessionSchema, async (data) => {
  const { id, ...updateData } = data;

  // Normalize expiresAt to an ISO string when present so the DB layer always
  // receives a string value for the `expiresAt` column.
  if (updateData.expiresAt !== undefined) {
    (updateData as any).expiresAt =
      typeof updateData.expiresAt === "string"
        ? updateData.expiresAt
        : typeof updateData.expiresAt === "number"
          ? (updateData.expiresAt as number) < 1_000_000_000_000
            ? new Date((updateData.expiresAt as number) * 1000).toISOString()
            : new Date(updateData.expiresAt as number).toISOString()
          : (updateData as any).expiresAt instanceof Date
            ? ((updateData as any).expiresAt as Date).toISOString()
            : String((updateData as any).expiresAt);
  }
  // Cast to `any` for the update to avoid type mismatch between the runtime
  // normalized object and the strict DB insert/update types.
  const result = await db
    .update(session)
    .set(updateData as any)
    .where(eq(session.id, id))
    .returning();
  return result[0];
});

// Command to delete a session
export const deleteSession = command(deleteSessionSchema, async ({ id }) => {
  await db.delete(session).where(eq(session.id, id));
});
