import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    billingInfos: r.many.billingInfo({
      from: r.user.id,
      to: r.billingInfo.userId,
    }),
    keys: r.many.key({
      from: r.user.id,
      to: r.key.userId,
    }),
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
  },
  billingInfo: {
    payment: r.one.payment({
      from: r.billingInfo.paymentId,
      to: r.payment.id,
    }),
    subPayment: r.one.payment({
      from: r.billingInfo.subPaymentId,
      to: r.payment.id,
    }),
    user: r.one.user({
      from: r.billingInfo.userId,
      to: r.user.id,
    }),
  },
  payment: {
    billingInfos: r.many.billingInfo({
      from: r.payment.id,
      to: r.billingInfo.paymentId,
    }),
    subBillingInfos: r.many.billingInfo({
      from: r.payment.id,
      to: r.billingInfo.subPaymentId,
    }),
  },
  key: {
    user: r.one.user({
      from: r.key.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
}));
