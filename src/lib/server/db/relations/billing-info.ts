import { relations } from "drizzle-orm/relations";
import { billingInfo } from "$/server/db/schema/billing-info";
import { payment } from "$/server/db/schema/payment";
import { user } from "$/server/db/schema/user";

export const billingInfoRelations = relations(billingInfo, ({ one }) => ({
  payment_paymentId: one(payment, {
    fields: [billingInfo.paymentId],
    references: [payment.id],
    relationName: "billingInfo_paymentId_payment_id",
  }),
  payment_subPaymentId: one(payment, {
    fields: [billingInfo.subPaymentId],
    references: [payment.id],
    relationName: "billingInfo_subPaymentId_payment_id",
  }),
  user: one(user, {
    fields: [billingInfo.userId],
    references: [user.id],
  }),
}));
