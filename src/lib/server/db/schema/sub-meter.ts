import { sqliteTable, index, foreignKey, text, integer } from "drizzle-orm/sqlite-core";
import { payment } from "./payment";
import { billingInfo } from "./billing-info";
import { timestamps } from ".";

export const subMeter = sqliteTable(
  "sub_meter",
  {
    id: text("id").primaryKey().notNull(),
    label: text("label").notNull(),
    billingInfoId: text("billing_info_id")
      .notNull()
      .references(() => billingInfo.id, { onDelete: "cascade", onUpdate: "cascade" }),
    subkWh: integer("sub_kWh").notNull(),
    reading: integer("reading").notNull(),
    status: text("status").notNull().default(""),
    paymentId: text("payment_id")
      .references(() => payment.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("sub_meter_billing_info_id_idx").on(table.billingInfoId),
    index("sub_meter_payment_id_idx").on(table.paymentId),
    foreignKey({
      columns: [table.billingInfoId],
      foreignColumns: [billingInfo.id],
      name: "sub_meter_billing_info_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payment.id],
      name: "sub_meter_payment_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
