import { z } from "zod";

export const createSessionSchema = z.object({
  userId: z.string(),
  activeExpires: z.number(),
  idleExpires: z.number(),
});

export const updateSessionSchema = createSessionSchema.extend({
  id: z.string(),
});

export const sessionSchema = updateSessionSchema;

export const getSessionsSchema = z.object({ userId: z.string() });

export const getSessionSchema = z.string();

export const deleteSessionSchema = z.object({ id: z.string() });
