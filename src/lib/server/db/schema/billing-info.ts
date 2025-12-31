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
import { timestamps } from ".";

export const billingInfo = sqliteTable(
  "billing_info",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    date: text().notNull(), // Use text for timestamp in sqlite
    totalKwh: integer("total_kwh").notNull(),
    subKwh: integer("sub_kwh"),
    balance: real().notNull(),
    status: text().notNull(),
    payPerKwh: real("pay_per_kwh").notNull(),
    subReadingLatest: integer("sub_reading_latest"),
    subReadingOld: integer("sub_reading_old"),
    paymentId: text("payment_id"),
    subPaymentId: text("sub_payment_id"),
    ...timestamps,
  },
  (table) => [
    index("billing_info_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payment.id],
      name: "billing_info_payment_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.subPaymentId],
      foreignColumns: [payment.id],
      name: "billing_info_sub_payment_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "billing_info_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
