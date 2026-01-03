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
  const result = await db
    .insert(session)
    .values({ id, ...data })
    .returning();
  return result[0];
});

// Form to update an existing session
export const updateSession = form(updateSessionSchema, async (data) => {
  const { id, ...updateData } = data;
  const result = await db
    .update(session)
    .set(updateData)
    .where(eq(session.id, id))
    .returning();
  return result[0];
});

// Command to delete a session
export const deleteSession = command(deleteSessionSchema, async ({ id }) => {
  await db.delete(session).where(eq(session.id, id));
});
