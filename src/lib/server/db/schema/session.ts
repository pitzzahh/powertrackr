import { sqliteTable, index, foreignKey } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const session = sqliteTable(
  "session",
  (t) => ({
    id: t.text("id").primaryKey().notNull(),
    expiresAt: t.integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    twoFactorVerified: t
      .integer("two_factor_verified", { mode: "boolean" })
      .notNull()
      .default(false),
  }),
  (table) => [
    index("session_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
