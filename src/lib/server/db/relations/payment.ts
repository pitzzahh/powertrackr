import { relations } from "drizzle-orm/relations";
import { payment } from "$/server/db/schema/payment";
import { billingInfo } from "$/server/db/schema/billing-info";

export const paymentRelations = relations(payment, ({ many }) => ({
  billingInfos_paymentId: many(billingInfo, {
    relationName: "billingInfo_paymentId_payment_id",
  }),
  billingInfos_subPaymentId: many(billingInfo, {
    relationName: "billingInfo_subPaymentId_payment_id",
  }),
}));
