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
} from "$/validators/session";
import { addSession, updateSessionBy, getSessionBy } from "$/server/crud/session-crud";
import { error } from "@sveltejs/kit";

// Query to get all sessions for a user
export const getSessions = query(getSessionsSchema, async ({ userId }) => {
  return await getSessionBy({ query: { userId }, options: { order: "asc" } });
});

// Query to get a single session by id
export const getSession = query(getSessionSchema, async (id) => {
  return await getSessionBy({ query: { id } });
});

// Form to create a new session
export const createSession = form(createSessionSchema, async (data) => {
  const {
    valid,
    value: [result],
    message,
  } = await addSession([data]);

  if (!valid) {
    error(400, message || "Failed to create session");
  }
  return result;
});

// Form to update an existing session
export const updateSession = form(updateSessionSchema, async (data) => {
  const { id, ...updateData } = data;

  const {
    valid,
    value: [result],
    message,
  } = await updateSessionBy({ query: { id } }, updateData);

  if (!valid) {
    error(400, message || "Failed to update session");
  }
  return result;
});

// Command to delete a session
export const deleteSession = command(deleteSessionSchema, async ({ id }) => {
  await db.delete(session).where(eq(session.id, id));
});
