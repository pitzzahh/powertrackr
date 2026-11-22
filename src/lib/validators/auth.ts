import * as v from "valibot";
import {
  EMAIL_CODE_FIELD,
  EMAIL_FIELD,
  NAME_FIELD,
  OTP_CODE_FIELD,
  PASSWORD_FIELD,
  TURNSTILE_TOKEN_FIELD,
} from "./shared.js";

const UUID_FIELD = v.pipe(v.string(), v.uuid());

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

  const uuidMatches = localPart.match(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
  );
  if (uuidMatches) {
    for (const match of uuidMatches) {
      const result = v.safeParse(UUID_FIELD, match);
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

export const REGISTER_SCHEMA = v.object({
  email: v.pipe(
    EMAIL_FIELD,
    v.check((email) => !isSpamEmail(email), "Invalid email address")
  ),
  name: NAME_FIELD,
  password: PASSWORD_FIELD,
  confirmPassword: PASSWORD_FIELD,
  turnstileToken: TURNSTILE_TOKEN_FIELD,
});

export const LOGIN_SCHEMA = v.object({
  email: EMAIL_FIELD,
  password: PASSWORD_FIELD,
  turnstileToken: TURNSTILE_TOKEN_FIELD,
});

export const VERIFY_EMAIL_SCHEMA = v.object({ code: EMAIL_CODE_FIELD });

export const TWO_FACTOR_SCHEMA = v.object({ code: OTP_CODE_FIELD });

// generateRandomRecoveryCode(): 10 random bytes, base32 = 16 characters.
export const RECOVER_2FA_SCHEMA = v.object({
  recoveryCode: v.pipe(v.string(), v.trim(), v.length(16, "Recovery codes are 16 characters")),
});

export const GENERATE_2FA_SECRET_SCHEMA = v.object({});

export const VERIFY_2FA_SCHEMA = v.object({
  code: OTP_CODE_FIELD,
  secret: v.pipe(v.string(), v.minLength(1)),
});

export const DISABLE_2FA_SCHEMA = TWO_FACTOR_SCHEMA;

export const FORGOT_PASSWORD_SCHEMA = v.object({ email: EMAIL_FIELD });

// `_password` fields: SvelteKit never echoes underscore-prefixed fields back to the client.
export const RESET_PASSWORD_SCHEMA = v.object({
  code: EMAIL_CODE_FIELD,
  _password: PASSWORD_FIELD,
  _confirmPassword: PASSWORD_FIELD,
});

export const CHANGE_PASSWORD_SCHEMA = v.object({
  currentPassword: PASSWORD_FIELD,
  newPassword: PASSWORD_FIELD,
  confirmPassword: PASSWORD_FIELD,
});
