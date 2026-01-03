import type { session } from "$/server/db/schema";

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export interface SessionFlags {
  twoFactorVerified: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}
