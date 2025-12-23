import { pgTable, text, timestamp, integer, doublePrecision, index, foreignKey } from "drizzle-orm/pg-core";
import { payment } from "./payment";
import { user } from "./user";

export const billingInfo = pgTable("BillingInfo", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	totalKwh: integer().notNull(),
	subKwh: integer(),
	balance: doublePrecision().notNull(),
	status: text().notNull(),
	payPerKwh: doublePrecision().notNull(),
	subReadingLatest: integer(),
	subReadingOld: integer(),
	paymentId: text(),
	subPaymentId: text(),
}, (table) => [
	index("BillingInfo_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payment.id],
			name: "BillingInfo_paymentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.subPaymentId],
			foreignColumns: [payment.id],
			name: "BillingInfo_subPaymentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "BillingInfo_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
