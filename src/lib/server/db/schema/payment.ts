import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { timestamps } from ".";

export const payment = pgTable("payment", {
  id: text().primaryKey().notNull(),
  amount: real().notNull(),
  date: timestamp("date")
    .default(sql`now()`)
    .notNull(),
  ...timestamps,
});

export type Payment = typeof payment.$inferSelect;

export type NewPayment = typeof payment.$inferInsert;
