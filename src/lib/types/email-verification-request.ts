import type { emailVerificationRequest } from "#lib/server/db/schema/index.js";
import type { NewUser, UserDTO } from "#lib/types/user.js";

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
