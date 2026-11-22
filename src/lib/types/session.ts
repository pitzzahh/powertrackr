import type { validateSessionToken } from "#lib/server/auth.js";
import type { Infer } from "#lib/validators/shared.js";
import type { SESSION_INSERT_SCHEMA, SESSION_SELECT_SCHEMA } from "#lib/validators/entities.js";

// Session flags set when a session is created (login, register, OAuth).
export type SessionFlags = Required<
  Pick<NewSession, "twoFactorVerified" | "ipAddress" | "userAgent">
>;

export type Session = Infer<typeof SESSION_SELECT_SCHEMA>;

export type NewSession = Infer<typeof SESSION_INSERT_SCHEMA>;

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;
