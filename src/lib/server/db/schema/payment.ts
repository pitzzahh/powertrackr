import { sqliteTable, uniqueIndex, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { timestamps } from ".";

export const payment = sqliteTable(
  "payment",
  {
    id: text().primaryKey().notNull(),
    amount: real(),
    date: text()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("payment_id_key").on(table.id)],
);

export type Payment = typeof payment.$inferSelect;

export type NewPayment = typeof payment.$inferInsert;
