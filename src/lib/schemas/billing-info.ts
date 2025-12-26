import { z } from "zod";

export const createBillingInfoSchema = z.object({
  userId: z.string(),
  date: z.string(),
  totalKwh: z.number(),
  subKwh: z.optional(z.number()),
  balance: z.number(),
  status: z.string(),
  payPerKwh: z.number(),
  subReadingLatest: z.optional(z.number()),
  subReadingOld: z.optional(z.number()),
  paymentId: z.optional(z.string()),
  subPaymentId: z.optional(z.string()),
});

export const updateBillingInfoSchema = createBillingInfoSchema.extend({
  id: z.string(),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = z.object({ userId: z.string() });

export const getBillingInfoSchema = z.string();

export const deleteBillingInfoSchema = z.object({ id: z.string() });
