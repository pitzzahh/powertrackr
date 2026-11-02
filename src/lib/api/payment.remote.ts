import { query, form } from "$app/server";
import { createPaymentSchema, getPaymentSchema } from "#lib/validators/payment.js";
import {
  addPayment,
  getPaymentBy,
  getTotalPaymentsAmountLogic,
} from "#lib/server/crud/payment-crud.js";
import { error } from "@sveltejs/kit";
import type { HelperResult } from "#lib/server/types/helper.js";
import type { Payment } from "#lib/types/payment.js";

// Query to get total payments amount
// Public endpoint with origin check - only allows requests from same origin
export const getTotalPaymentsAmount = query(getTotalPaymentsAmountLogic);

// Query to get all payments
export const getPayments = query(async () => {
  return await getPaymentBy({ query: {} });
});

// Query to get a single payment by id
export const getPayment = query(getPaymentSchema, async (id) => {
  return (await getPaymentBy({
    query: {
      id,
    },
    options: { limit: 1 },
  })) as HelperResult<Payment[]>;
});

// Form to create a new payment
export const createPayment = form(createPaymentSchema, async (data) => {
  const {
    valid,
    value: [addedPayment],
    message,
  } = await addPayment([
    {
      ...data,
      date: new Date(data.date),
    },
  ]);

  if (!valid) {
    error(400, `Failed to add payment: ${message || "Unknown reason"}`);
  }
  return addedPayment;
});
