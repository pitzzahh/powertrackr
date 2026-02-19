import { query, form, command, getRequestEvent } from "$app/server";
import {
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentSchema,
  deletePaymentSchema,
} from "$/validators/payment";
import {
  addPayment,
  deletePaymentBy,
  getPaymentBy,
  getTotalPaymentsAmount as getTotalPaymentsAmountCrud,
  updatePaymentBy,
} from "$/server/crud/payment-crud";
import { error } from "@sveltejs/kit";
import type { HelperResult } from "$/server/types/helper";
import type { Payment } from "$/types/payment";

// Query to get total payments amount
// Public endpoint with origin check - only allows requests from same origin
export const getTotalPaymentsAmount = query(async () => {
  const event = getRequestEvent();
  const origin = event.request.headers.get("origin");
  const referer = event.request.headers.get("referer");
  const siteOrigin = event.url.origin;

  const isAllowedOrigin =
    origin === siteOrigin || origin === null || (referer && referer.startsWith(siteOrigin));

  if (!isAllowedOrigin) {
    throw error(403, "Forbidden");
  }

  return await getTotalPaymentsAmountCrud();
});

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

// Form to update an existing payment
export const updatePayment = form(updatePaymentSchema, async (data) => {
  const {
    valid,
    value: [updatedPayment],
    message,
  } = await updatePaymentBy(
    { query: { id: data.id } },
    {
      ...data,
      date: new Date(data.date),
    }
  );

  if (!valid) {
    error(400, `Failed to update payment: ${message || "Unknown reason"}`);
  }

  return updatedPayment;
});

// Command to delete a payment
export const deletePayment = command(deletePaymentSchema, async ({ id }) => {
  const { valid } = await deletePaymentBy({ query: { id } });

  if (!valid) {
    error(400, `Failed to delete payment with id ${id}`);
  }

  return valid;
});
