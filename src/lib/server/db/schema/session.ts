import { pgTable, uniqueIndex, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from "./user";

export const session = pgTable(
  "session",
  (t) => ({
    id: t.text().primaryKey().notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    twoFactorVerified: t.boolean("two_factor_verified").notNull().default(false),
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
  ]
);
