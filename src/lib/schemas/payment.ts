import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.optional(z.number()),
  date: z.optional(z.string()),
});

export const updatePaymentSchema = createPaymentSchema.extend({
  id: z.string(),
});

export const paymentSchema = updatePaymentSchema;

export const getPaymentsSchema = z.object({ userId: z.string() }); // Assuming filter by user, but payment doesn't have userId

// Payment doesn't have userId, so perhaps get all or by id

export const getPaymentSchema = z.string();

export const deletePaymentSchema = z.object({ id: z.string() });
