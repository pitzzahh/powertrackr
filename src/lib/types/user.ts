import type { Infer } from "#lib/validators/shared.js";
import type { Session } from "#lib/types/session.js";
import type { USER_INSERT_SCHEMA, USER_SELECT_SCHEMA } from "#lib/validators/entities.js";
import type { UPDATE_USER_SCHEMA } from "#lib/validators/user.js";

export type User = Infer<typeof USER_SELECT_SCHEMA>;

export type NewUser = Infer<typeof USER_INSERT_SCHEMA>;

export type UpdateUserInput = Infer<typeof UPDATE_USER_SCHEMA>;

// A user as safe to send to a client: no secrets.
export type UserDTO = Omit<User, "passwordHash" | "totpKey" | "recoveryCode">;

export type UserDTOWithSessions = Partial<UserDTO> & { sessions?: Session[] };
