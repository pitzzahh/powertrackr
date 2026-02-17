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
  id: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.pipe(v.string(), v.email())),
  githubId: v.optional(v.number()),
  image: v.optional(v.string()),
  passwordHash: v.optional(v.string()),
});

export const userSchema = updateUserSchema;

export const getUserSchema = v.string();

export const deleteUserSchema = v.object({
  id: v.string(),
  confirmEmail: v.pipe(v.string(), v.email()),
});
