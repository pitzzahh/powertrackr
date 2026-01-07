import { sqliteTable, index, foreignKey, text, integer } from "drizzle-orm/sqlite-core";
import { payment } from "./payment";
import { billingInfo } from "./billing-info";
import { timestamps } from ".";

export const subMeter = sqliteTable(
  "sub_meter",
  {
    id: text().primaryKey().notNull(),
    billingInfoId: text("billing_info_id").notNull(),
    subKwh: integer("sub_kwh"),
    subReadingLatest: integer("sub_reading_latest"),
    subReadingOld: integer("sub_reading_old"),
    paymentId: text("payment_id"),
    ...timestamps,
  },
  (table) => [
    index("sub_meter_billing_info_id_idx").on(table.billingInfoId),
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
  ],
);
