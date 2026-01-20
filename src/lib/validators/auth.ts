import * as v from "valibot";

export const registerSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(2)),
  password: v.pipe(v.string(), v.minLength(8)),
  confirmPassword: v.pipe(v.string(), v.minLength(8)),
});

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

export const verifyEmailSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
});

export const setup2FASchema = v.object({
  code: v.pipe(v.string(), v.minLength(6), v.maxLength(6)),
});

export const forgotPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export const resetPasswordSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(8)),
  confirmPassword: v.pipe(v.string(), v.minLength(8)),
});
