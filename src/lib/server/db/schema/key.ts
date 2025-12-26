import { sqliteTable, text, index, foreignKey } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const key = sqliteTable(
  "Key",
  {
    id: text().primaryKey().notNull(),
    hashedPassword: text("hashed_password"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    index("Key_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Key_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
