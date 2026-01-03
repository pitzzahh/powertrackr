import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
