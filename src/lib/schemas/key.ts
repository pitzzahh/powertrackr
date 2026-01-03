import { z } from "zod";

export const createKeySchema = z.object({
  userId: z.string(),
  hashedPassword: z.optional(z.string()),
});

export const updateKeySchema = createKeySchema.extend({
  id: z.string(),
});

export const keySchema = updateKeySchema;

export const getKeysSchema = z.object({ userId: z.string() });

export const getKeySchema = z.string();

export const deleteKeySchema = z.object({ id: z.string() });
