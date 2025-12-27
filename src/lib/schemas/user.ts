import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string(),
  username: z.string(),
  picture: z.optional(z.string()),
});

export const updateUserSchema = createUserSchema.extend({
  id: z.string(),
});

export const userSchema = updateUserSchema;

export const getUsersSchema = z.object({}); // Get all users, or perhaps by id

export const getUserSchema = z.string();

export const deleteUserSchema = z.object({ id: z.string() });
