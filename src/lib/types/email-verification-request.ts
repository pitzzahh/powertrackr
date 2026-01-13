import type { emailVerificationRequest } from "$/server/db/schema";
import type { UserDTO } from "$/types/user";

export type EmailVerificationRequest = typeof emailVerificationRequest.$inferSelect;
export type NewEmailVerificationRequest = typeof emailVerificationRequest.$inferInsert;

export type EmailVerificationRequestDTO = {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
  user?: UserDTO;
};
