import * as v from "valibot";

export const createKeySchema = v.object({
  userId: v.string(),
  hashedPassword: v.optional(v.string()),
});

export const updateKeySchema = v.object({
  id: v.string(),
  userId: v.string(),
  hashedPassword: v.optional(v.string()),
});

export const keySchema = updateKeySchema;

export const getKeysSchema = v.object({ userId: v.string() });

export const getKeySchema = v.string();

export const deleteKeySchema = v.object({ id: v.string() });
