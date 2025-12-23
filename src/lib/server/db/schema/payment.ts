import { pgTable, uniqueIndex, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const payment = pgTable("Payment", {
	id: text().primaryKey().notNull(),
	amount: doublePrecision(),
	date: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("Payment_id_key").using("btree", table.id.asc().nullsLast().op("text_ops")),
]);
