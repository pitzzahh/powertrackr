import { pgTable, uniqueIndex, text, real, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { timestamps } from ".";

export const payment = pgTable(
  "payment",
  {
    id: text().primaryKey().notNull(),
    amount: real(),
    date: timestamp("date")
      .default(sql`now()`)
      .notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("payment_id_key").on(table.id)]
);

export type Payment = typeof payment.$inferSelect;

export type NewPayment = typeof payment.$inferInsert;
