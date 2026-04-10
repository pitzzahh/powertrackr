import * as v from "valibot";

const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const spamRegex = /spam|bot|fake|temp|dummy/i;

const digitsOnlyRegex = /^\d+$/;

const shortRegex = /^.{1,2}$/;

const hashRegex = /^[a-f0-9]{32,64}$/i;

const randomStringRegex = /^[a-z0-9]{8,}$/i; // Long random lowercase/digits

function isSpamEmail(email: string): boolean {
  const [localPart, domain] = email.split("@");
  if (!domain) return false;
  if (uuidRegex.test(localPart)) return true;
  if (spamRegex.test(localPart)) return true;
  if (digitsOnlyRegex.test(localPart)) return true;
  if (shortRegex.test(localPart)) return true;
  if (hashRegex.test(localPart)) return true;
  if (randomStringRegex.test(localPart) && localPart.length > 20) return true;
  return false;
}

export const registerSchema = v.object({
  email: v.pipe(
    v.string(),
    v.email(),
    v.check((email) => !isSpamEmail(email), "Invalid email address")
  ),
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

export const twoFactorSchema = v.object({
  code: v.pipe(v.string(), v.maxLength(6)),
});

export const generate2FASecretSchema = v.object({});

export const verify2FASchema = v.object({
  code: v.pipe(v.string(), v.maxLength(6)),
  secret: v.pipe(v.string(), v.minLength(1)),
});

export const disable2FASchema = v.object({
  code: v.pipe(v.string(), v.maxLength(6)),
});

export const forgotPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export const resetPasswordSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
  _password: v.pipe(v.string(), v.minLength(8)),
  _confirmPassword: v.pipe(v.string(), v.minLength(8)),
});

export const changePasswordSchema = v.object({
  currentPassword: v.pipe(v.string(), v.minLength(8)),
  newPassword: v.pipe(v.string(), v.minLength(8)),
  confirmPassword: v.pipe(v.string(), v.minLength(8)),
});
