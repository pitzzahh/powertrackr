import { sqliteTable, index, uniqueIndex, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { billingInfo } from "./billing-info";
import { payment } from "./payment";
import { timestamps } from ".";

/**
 * A sub-meter reading for one billing period. Sub-meters ARE tenant accounts:
 * each row links a tenant user to one billing period, so the tenant id is the
 * sub-meter id.
 *
 * Readings can be created "pending" (reading/subkWh/paymentId NULL) when the
 * owner opens a billing period and waits for the tenant to submit a reading;
 * finalization materializes the usage and payment.
 */
export const tenantReading = sqliteTable(
  "tenant_reading",
  {
    id: text("id").primaryKey().notNull(),
    tenantUserId: text("tenant_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    billingInfoId: text("billing_info_id")
      .notNull()
      .references(() => billingInfo.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reading: integer("reading"),
    subkWh: integer("sub_kWh"),
    status: text("status").notNull().default(""),
    paymentId: text("payment_id").references(() => payment.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tenant_reading_tenant_billing_unique").on(table.tenantUserId, table.billingInfoId),
    index("tenant_reading_tenant_user_id_idx").on(table.tenantUserId),
    index("tenant_reading_billing_info_id_idx").on(table.billingInfoId),
    index("tenant_reading_payment_id_idx").on(table.paymentId),
  ]
);
