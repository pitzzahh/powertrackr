import { query, form, command } from "$app/server";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db/index";
import { key } from "$lib/server/db/schema/key";
import {
  createKeySchema,
  updateKeySchema,
  getKeysSchema,
  getKeySchema,
  deleteKeySchema,
} from "$lib/schemas/key";

// Query to get all keys for a user
export const getKeys = query(getKeysSchema, async ({ userId }) => {
  return await db.query.key.findMany({ where: { userId } });
});

// Query to get a single key by id
export const getKey = query(getKeySchema, async (id) => {
  return await db.query.key.findFirst({ where: { id } });
});

// Form to create a new key
export const createKey = form(createKeySchema, async (data) => {
  const id = crypto.randomUUID();
  const result = await db
    .insert(key)
    .values({ id, ...data })
    .returning();
  return result[0];
});

// Form to update an existing key
export const updateKey = form(updateKeySchema, async (data) => {
  const { id, ...updateData } = data;
  const result = await db
    .update(key)
    .set(updateData)
    .where(eq(key.id, id))
    .returning();
  return result[0];
});

// Command to delete a key
export const deleteKey = command(deleteKeySchema, async ({ id }) => {
  await db.delete(key).where(eq(key.id, id));
});
