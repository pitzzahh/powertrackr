import { sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const passwordResetSession = sqliteTable("password_reset_session", (t) => ({
  id: t.text().primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id),
  email: t.text().notNull(),
  code: t.text().notNull(),
  expiresAt: t.integer("expires_at").notNull(),
  emailVerified: t.integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  twoFactorVerified: t.integer("two_factor_verified", { mode: "boolean" }).default(false).notNull(),
}));
