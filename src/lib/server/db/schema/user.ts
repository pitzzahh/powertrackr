import { sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { timestamps } from ".";

export const user = sqliteTable(
  "user",
  (t) => ({
    id: t.text().primaryKey(),
    name: t.text().notNull(),
    email: t.text().notNull(),
    emailVerified: t
      .integer("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: t.text(),
    ...timestamps,
  }),
  (table) => [uniqueIndex("user_email_key").on(table.email)],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
