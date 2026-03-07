import { sqliteTable, uniqueIndex, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from ".";

export const user = sqliteTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    githubId: integer("github_id"),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
    totpKey: text("totp_key"),
    recoveryCode: text("recovery_code"),
    registeredTwoFactor: integer("registered_two_factor", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: text(),
    passwordHash: text("password_hash"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_email_key").on(table.email),
    uniqueIndex("user_github_id_key").on(table.githubId),
  ]
);
