import type { passwordResetSession } from "$/server/db/schema";

export type PasswordResetSession = typeof passwordResetSession.$inferSelect;
export type NewPasswordResetSession = typeof passwordResetSession.$inferInsert;

export type PasswordResetSessionDTO = {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
  emailVerified: boolean;
  twoFactorVerified: boolean;
};
