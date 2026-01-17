import { pgTable, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from "./user";

export const passwordResetSession = pgTable(
  "password_reset_session",
  (t) => ({
    id: t.text().primaryKey(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: t.text().notNull(),
    code: t.text().notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
    emailVerified: t.boolean("email_verified").default(false).notNull(),
    twoFactorVerified: t.boolean("two_factor_verified").default(false).notNull(),
  }),
  (table) => [
    index("password_reset_session_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "password_reset_session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
