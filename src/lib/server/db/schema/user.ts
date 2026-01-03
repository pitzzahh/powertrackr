import { sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { timestamps } from ".";

export const user = sqliteTable(
  "user",
  (t) => ({
    id: t.text().primaryKey(),
    githubId: t.integer("github_id").unique(),
    name: t.text().notNull(),
    email: t.text().notNull(),
    emailVerified: t
      .integer("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    totpKey: t.blob("totp_key"),
    recoveryCode: t.blob("recovery_code"),
    registeredTwoFactor: t
      .integer("registered_two_factor", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: t.text(),
    passwordHash: t.text("password_hash"),
    ...timestamps,
  }),
  (table) => [uniqueIndex("user_email_key").on(table.email)],
);
