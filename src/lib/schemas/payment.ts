import * as v from "valibot";

export const createPaymentSchema = v.object({
  amount: v.optional(v.number()),
  date: v.optional(v.string()),
});

export const updatePaymentSchema = v.object({
  id: v.string(),
  amount: v.optional(v.number()),
  date: v.optional(v.string()),
});

export const paymentSchema = updatePaymentSchema;

export const getPaymentsSchema = v.object({ userId: v.string() }); // Assuming filter by user, but payment doesn't have userId

// Payment doesn't have userId, so perhaps get all or by id

export const getPaymentSchema = v.string();

export const deletePaymentSchema = v.object({ id: v.string() });
