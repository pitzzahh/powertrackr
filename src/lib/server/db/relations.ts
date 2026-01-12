import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    billingInfos: r.many.billingInfo({
      from: r.user.id,
      to: r.billingInfo.userId,
    }),
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    emailVerificationRequests: r.many.emailVerificationRequest({
      from: r.user.id,
      to: r.emailVerificationRequest.userId,
    }),
  },
  billingInfo: {
    payment: r.one.payment({
      from: r.billingInfo.paymentId,
      to: r.payment.id,
    }),
    subMeters: r.many.subMeter({
      from: r.billingInfo.id,
      to: r.subMeter.billingInfoId,
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
    subMeters: r.many.subMeter({
      from: r.payment.id,
      to: r.subMeter.paymentId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  emailVerificationRequest: {
    user: r.one.user({
      from: r.emailVerificationRequest.userId,
      to: r.user.id,
    }),
  },
  subMeter: {
    billingInfo: r.one.billingInfo({
      from: r.subMeter.billingInfoId,
      to: r.billingInfo.id,
    }),
    payment: r.one.payment({
      from: r.subMeter.paymentId,
      to: r.payment.id,
    }),
  },
}));
