import * as v from "valibot";

const baseUserSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  githubId: v.optional(v.number()),
  image: v.optional(v.string()),
  passwordHash: v.optional(v.string()),
});

export const createUserSchema = baseUserSchema;

export const updateUserSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  githubId: v.optional(v.number()),
  image: v.optional(v.string()),
  passwordHash: v.optional(v.string()),
  id: v.string(),
});

export const userSchema = updateUserSchema;

export const getUserSchema = v.string();

export const deleteUserSchema = v.object({ id: v.string() });
