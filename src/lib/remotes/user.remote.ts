import { query, form, command } from "$app/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db/index";
import { user } from "$lib/server/db/schema/user";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
} from "$lib/schemas/user";

// Query to get all users
export const getUsers = query(z.object({}), async () => {
  return await db.query.user.findMany();
});

// Query to get a single user by id
export const getUser = query(getUserSchema, async (id) => {
  return await db.query.user.findFirst({ where: { id } });
});

// Query to get a single user by github id
export const getUserFromGitHubId = query(z.number(), async (githubId) => {
  return await db.query.user.findFirst({ where: { githubId } });
});

// Form to create a new user
export const createUser = form(createUserSchema, createUserInternal);
export const createUserCommand = command(createUserSchema, createUserInternal);

// Form to update an existing user
export const updateUser = form(updateUserSchema, async (data) => {
  const { id, ...updateData } = data;
  const result = await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, id))
    .returning();
  return result[0];
});

// Command to delete a user
export const deleteUser = command(deleteUserSchema, async ({ id }) => {
  await db.delete(user).where(eq(user.id, id));
});

async function createUserInternal(
  data: Omit<z.infer<typeof createUserSchema>, "id">,
) {
  const id = crypto.randomUUID();
  const result = await db
    .insert(user)
    .values({ id, ...data })
    .returning();
  return result[0];
}
