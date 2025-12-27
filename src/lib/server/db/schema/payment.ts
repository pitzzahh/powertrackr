import { sqliteTable, uniqueIndex, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const payment = sqliteTable(
  "Payment",
  {
    id: text().primaryKey().notNull(),
    amount: real(),
    date: text()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [uniqueIndex("Payment_id_key").on(table.id)],
);

export type Payment = typeof payment.$inferSelect;

export type NewPayment = typeof payment.$inferInsert;
