import { pgTable, index, foreignKey } from "drizzle-orm/pg-core";
import { payment } from "./payment";
import { user } from "./user";

export const billingInfo = pgTable(
  "BillingInfo",
  (t) => ({
    id: t.text().primaryKey().notNull(),
    userId: t.text("user_id").notNull(),
    date: t.timestamp({ precision: 3, mode: "string" }).notNull(),
    totalKwh: t.integer().notNull(),
    subKwh: t.integer(),
    balance: t.doublePrecision().notNull(),
    status: t.text().notNull(),
    payPerKwh: t.doublePrecision().notNull(),
    subReadingLatest: t.integer(),
    subReadingOld: t.integer(),
    paymentId: t.text(),
    subPaymentId: t.text(),
  }),
  (table) => [
    index("BillingInfo_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payment.id],
      name: "BillingInfo_paymentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.subPaymentId],
      foreignColumns: [payment.id],
      name: "BillingInfo_subPaymentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "BillingInfo_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
