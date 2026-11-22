import * as v from "valibot";
import type { Status } from "#lib/types/billing-info.js";

/**
 * Output type of a schema. The single bridge that lets `#lib/types` derive
 * types from schemas without importing valibot itself.
 */
export type Infer<T extends v.GenericSchema> = v.InferOutput<T>;

// Reusable fields. Domain schemas compose these instead of re-declaring them.

// Schema for remote queries/commands that take no arguments.
export const EMPTY_SCHEMA = v.object({});

// Optional short string (e.g. env vars with `??` fallbacks at call sites).
export const OPTIONAL_STRING = v.optional(v.string());

// A row id (uuid). Empty strings are rejected so a blank form select fails here.
export const ID_FIELD = v.pipe(
  v.string(),
  v.check((val) => !!val, "is required")
);

export const EMAIL_FIELD = v.pipe(v.string(), v.trim(), v.email());

export const PASSWORD_FIELD = v.pipe(v.string(), v.minLength(8));

export const NAME_FIELD = v.pipe(v.string(), v.trim(), v.minLength(2));

// A 6-digit TOTP code from an authenticator app.
export const OTP_CODE_FIELD = v.pipe(v.string(), v.maxLength(6));

// A one-time code sent by email (verification, password reset).
export const EMAIL_CODE_FIELD = v.pipe(v.string(), v.minLength(1));

// Turnstile token submitted by the widget's hidden input. Optional at the schema
// level so a missing/blocked widget produces a friendly field error in the
// handler instead of a generic "invalid type" message.
export const TURNSTILE_TOKEN_FIELD = v.optional(v.string());

// A date as sent by forms and imports (`yyyy-mm-dd` or ISO string).
export const DATE_STRING_FIELD = v.pipe(
  v.string(),
  v.check((val) => !!val, "is required")
);

// Billing amounts and totals: strictly positive.
export const POSITIVE_NUMBER_FIELD = v.pipe(
  v.number("must be a number"),
  v.minValue(1, "must be greater than 0")
);

// A cumulative meter reading.
export const READING_FIELD = v.pipe(
  v.number("must be a number"),
  v.minValue(0, "must be 0 or greater")
);

export const STATUS_VALUES = ["paid", "pending", "due"] as const;
export const STATUS_FIELD = v.picklist(STATUS_VALUES);
// Forms and imports may omit the status: treat that as "pending".
export const STATUS_WITH_DEFAULT_FIELD = v.fallback(STATUS_FIELD, "pending");

/** Narrow a stored (free-text) status to a known one; unknown values become "pending". */
export function toStatus(value: unknown): Status {
  return v.parse(STATUS_WITH_DEFAULT_FIELD, value);
}
