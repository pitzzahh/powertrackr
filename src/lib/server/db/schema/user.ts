import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "User",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    username: text().notNull(),
    picture: text(),
  },
  (table) => [uniqueIndex("User_username_key").on(table.username)],
);
