import type { emailVerificationRequest } from "$/server/db/schema";
import type { NewUser, UserDTO } from "$/types/user";

export type EmailVerificationRequest = typeof emailVerificationRequest.$inferSelect;
export type NewEmailVerificationRequest = typeof emailVerificationRequest.$inferInsert;

export type EmailVerificationRequestDTO = {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: Date;
  user?: UserDTO;
};

export type NewEmailVerificationRequestWithUser = NewEmailVerificationRequest & {
  user?: NewUser;
};
