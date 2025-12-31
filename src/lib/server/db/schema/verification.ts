import { sqliteTable } from "drizzle-orm/sqlite-core";
import { timestamps } from "./timestamps";

export const verification = sqliteTable("verification", (t) => ({
  id: t.text().primaryKey(),
  identifier: t.text().notNull(),
  value: t.text().notNull(),
  expiresAt: t.integer("expires_at", { mode: "timestamp" }).notNull(),
  ...timestamps,
}));

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
