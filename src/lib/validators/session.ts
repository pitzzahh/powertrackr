import * as v from "valibot";

export const createSessionSchema = v.object({
  id: v.string(),
  userId: v.string(),
  expiresAt: v.pipe(
    v.string(),
    v.transform((val) => new Date(val))
  ),
});

export const updateSessionSchema = v.object({
  id: v.string(),
  userId: v.string(),
  expiresAt: v.pipe(
    v.string(),
    v.transform((val) => new Date(val))
  ),
});

export const sessionSchema = updateSessionSchema;

export const getSessionsSchema = v.object({ userId: v.string() });

export const getSessionSchema = v.string();

export const deleteSessionSchema = v.object({ id: v.string() });
