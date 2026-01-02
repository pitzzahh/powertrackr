import {
  sqliteTable,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const session = sqliteTable(
  "session",
  (t) => ({
    id: t.text().primaryKey().notNull(),
    expiresAt: t.integer("expires_at", { mode: "timestamp" }).notNull(),
    token: t.text().notNull().unique(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (table) => [
    uniqueIndex("session_id_key").on(table.id),
    index("session_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
