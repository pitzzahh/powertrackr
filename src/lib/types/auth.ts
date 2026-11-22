import type { Infer } from "#lib/validators/shared.js";
import type { NewUser, UserDTO } from "#lib/types/user.js";
import type {
  CHANGE_PASSWORD_SCHEMA,
  LOGIN_SCHEMA,
  REGISTER_SCHEMA,
  RESET_PASSWORD_SCHEMA,
} from "#lib/validators/auth.js";
import type {
  EMAIL_VERIFICATION_REQUEST_INSERT_SCHEMA,
  EMAIL_VERIFICATION_REQUEST_SELECT_SCHEMA,
  PASSWORD_RESET_SESSION_INSERT_SCHEMA,
  PASSWORD_RESET_SESSION_SELECT_SCHEMA,
} from "#lib/validators/entities.js";

export type RegisterInput = Infer<typeof REGISTER_SCHEMA>;

export type LoginInput = Infer<typeof LOGIN_SCHEMA>;

export type ResetPasswordInput = Infer<typeof RESET_PASSWORD_SCHEMA>;

export type ChangePasswordInput = Infer<typeof CHANGE_PASSWORD_SCHEMA>;

export type EmailVerificationRequestDTO = EmailVerificationRequest & { user?: UserDTO };

export type NewEmailVerificationRequestWithUser = NewEmailVerificationRequest & { user?: NewUser };

export type EmailVerificationRequest = Infer<typeof EMAIL_VERIFICATION_REQUEST_SELECT_SCHEMA>;

export type NewEmailVerificationRequest = Infer<typeof EMAIL_VERIFICATION_REQUEST_INSERT_SCHEMA>;

export type PasswordResetSession = Infer<typeof PASSWORD_RESET_SESSION_SELECT_SCHEMA>;

export type NewPasswordResetSession = Infer<typeof PASSWORD_RESET_SESSION_INSERT_SCHEMA>;

export type PasswordRequirement = {
  regex: RegExp;
  text: string;
};

export type AuthAction =
  | "login"
  | "register"
  | "verify-email"
  | "2fa-setup"
  | "2fa-checkpoint"
  | "reset-password"
  | "forgot-password";
