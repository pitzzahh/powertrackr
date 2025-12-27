import {
  sqliteTable,
  index,
  foreignKey,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { payment } from "./payment";
import { user } from "./user";

export const billingInfo = sqliteTable(
  "BillingInfo",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    date: text().notNull(), // Use text for timestamp in sqlite
    totalKwh: integer().notNull(),
    subKwh: integer(),
    balance: real().notNull(),
    status: text().notNull(),
    payPerKwh: real().notNull(),
    subReadingLatest: integer(),
    subReadingOld: integer(),
    paymentId: text(),
    subPaymentId: text(),
  },
  (table) => [
    index("BillingInfo_user_id_idx").on(table.userId),
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

export type BillingInfo = typeof billingInfo.$inferSelect;
export type NewBillingInfo = typeof billingInfo.$inferInsert;
