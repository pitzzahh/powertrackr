import type { emailVerificationRequest } from "$/server/db/schema";

export type EmailVerificationRequest = typeof emailVerificationRequest.$inferSelect;
export type NewEmailVerificationRequest = typeof emailVerificationRequest.$inferInsert;

export type EmailVerificationRequestDTO = {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
};
