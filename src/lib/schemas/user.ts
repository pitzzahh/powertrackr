import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string(),
  email: z.email(),
  githubId: z.number().optional(),
  image: z.optional(z.string()),
  passwordHash: z.string(),
});

export const updateUserSchema = createUserSchema.extend({
  id: z.string(),
});

export const userSchema = updateUserSchema;

export const getUsersSchema = z.object({}); // Get all users, or perhaps by id

export const getUserSchema = z.string();

export const deleteUserSchema = z.object({ id: z.string() });
