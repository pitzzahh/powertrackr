import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const session = sqliteTable(
  "Session",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    activeExpires: integer("active_expires").notNull(),
    idleExpires: integer("idle_expires").notNull(),
  },
  (table) => [
    uniqueIndex("Session_id_key").on(table.id),
    index("Session_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
