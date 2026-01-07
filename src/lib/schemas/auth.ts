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
