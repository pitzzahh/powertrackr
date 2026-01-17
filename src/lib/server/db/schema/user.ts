import { pgTable, uniqueIndex, text, integer, boolean, bytea } from "drizzle-orm/pg-core";
import { timestamps } from ".";

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    githubId: integer("github_id").unique(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    totpKey: bytea("totp_key"),
    recoveryCode: bytea("recovery_code"),
    registeredTwoFactor: boolean("registered_two_factor").default(false).notNull(),
    image: text(),
    passwordHash: text("password_hash"),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_email_key").on(table.email)]
);
