import { pgTable, index, foreignKey, text, integer } from "drizzle-orm/pg-core";
import { payment } from "./payment";
import { billingInfo } from "./billing-info";
import { timestamps } from ".";

export const subMeter = pgTable(
  "sub_meter",
  {
    id: text().primaryKey().notNull(),
    label: text().notNull(),
    billingInfoId: text("billing_info_id")
      .notNull()
      .references(() => billingInfo.id, { onDelete: "cascade", onUpdate: "cascade" }),
    subkWh: integer("sub_kWh"),
    reading: integer().notNull(),
    paymentId: text("payment_id").references(() => payment.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
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
