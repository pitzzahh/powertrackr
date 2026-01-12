import { sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const emailVerificationRequest = sqliteTable("email_verification_request", (t) => ({
  id: t.text().primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id),
  email: t.text().notNull(),
  code: t.text().notNull(),
  expiresAt: t.integer("expires_at").notNull(),
}));
