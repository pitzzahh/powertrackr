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
    passwordResetSessions: r.many.passwordResetSession({
      from: r.user.id,
      to: r.passwordResetSession.userId,
    }),
    readingSubmissions: r.many.readingSubmission({
      from: r.user.id,
      to: r.readingSubmission.tenantUserId,
    }),
    tenantReadings: r.many.tenantReading({
      from: r.user.id,
      to: r.tenantReading.tenantUserId,
    }),
    tenants: r.many.user({
      from: r.user.id,
      to: r.user.ownerId,
    }),
  },
  billingInfo: {
    payment: r.one.payment({
      from: r.billingInfo.paymentId,
      to: r.payment.id,
    }),
    tenantReadings: r.many.tenantReading({
      from: r.billingInfo.id,
      to: r.tenantReading.billingInfoId,
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
    tenantReadings: r.many.tenantReading({
      from: r.payment.id,
      to: r.tenantReading.paymentId,
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
  passwordResetSession: {
    user: r.one.user({
      from: r.passwordResetSession.userId,
      to: r.user.id,
    }),
  },
  tenantReading: {
    tenant: r.one.user({
      from: r.tenantReading.tenantUserId,
      to: r.user.id,
    }),
    billingInfo: r.one.billingInfo({
      from: r.tenantReading.billingInfoId,
      to: r.billingInfo.id,
    }),
    payment: r.one.payment({
      from: r.tenantReading.paymentId,
      to: r.payment.id,
    }),
  },
  readingSubmission: {
    tenant: r.one.user({
      from: r.readingSubmission.tenantUserId,
      to: r.user.id,
    }),
  },
}));
