import * as v from "valibot";

// Spam keywords
const spamKeywords = /spam|bot|fake|temp|dummy|test|noreply|no-reply|admin|support|info|marketing/i;

// Common fake email patterns
const digitsOnlyRegex = /^\d+$/;
const shortRegex = /^.{1,2}$/;
const hashRegex = /^[a-f0-9]{32,64}$/i;
const longRandomRegex = /^[a-z0-9]{20,}$/i;

// Common fake patterns
const userNumberRegex = /^user-?\d{3,}/i;
const nameNumberRegex = /^[a-z]+-?\d{4,}$/i;
const numberNameRegex = /^\d{3,}-?[a-z]+$/i;

function isSpamEmail(email: string): boolean {
  if (!email.includes("@")) return false;

  const [localPart, domain] = email.toLowerCase().split("@");
  if (!localPart || !domain) return false;

  if (spamKeywords.test(localPart)) return true;
  if (shortRegex.test(localPart) || digitsOnlyRegex.test(localPart)) return true;
  if (hashRegex.test(localPart)) return true;
  if (longRandomRegex.test(localPart)) return true;
  if (userNumberRegex.test(localPart)) return true;
  if (nameNumberRegex.test(localPart)) return true;
  if (numberNameRegex.test(localPart)) return true;
  const localPartSchema = v.pipe(v.string(), v.uuid());
  const uuidMatches = localPart.match(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
  );
  if (uuidMatches) {
    for (const match of uuidMatches) {
      const result = v.safeParse(localPartSchema, match);
      if (result.success) {
        return true; // Found a valid UUID inside the local part
      }
    }
  }
  const disposableRegex =
    /(tempmail|10minutemail|guerrillamail|throwaway|trashmail|mailinator|disposable|tmpmail|test|yopmail)/i;
  if (disposableRegex.test(domain)) return true;

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
