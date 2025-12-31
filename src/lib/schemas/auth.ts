import { z } from "zod/mini";

export const signupSchema = z.object({
  name: z.string().check(z.minLength(4)),
  email: z.email(),
  password: z.string().check(z.minLength(8)),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().check(z.minLength(8)),
});
