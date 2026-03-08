import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { timestamps } from ".";

export const payment = sqliteTable("payment", {
  id: text().primaryKey().notNull(),
  amount: real().notNull(),
  date: integer("date", { mode: "timestamp_ms" })
    .default(sql`(unixepoch()*1000)`)
    .notNull(),
  ...timestamps,
});

export type Payment = typeof payment.$inferSelect;

export type NewPayment = typeof payment.$inferInsert;
