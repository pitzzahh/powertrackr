import { query, form, command } from "$app/server";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db/index";
import { payment } from "$lib/server/db/schema/payment";
import {
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentSchema,
  deletePaymentSchema,
} from "$/validators/payment";
import { addPayment, updatePaymentBy } from "$/server/crud/payment-crud";
import { error } from "@sveltejs/kit";

// Query to get all payments
export const getPayments = query(async () => {
  return await db.query.payment.findMany();
});

// Query to get a single payment by id
export const getPayment = query(getPaymentSchema, async (id) => {
  return await db.query.payment.findFirst({ where: { id } });
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
  await db.delete(payment).where(eq(payment.id, id));
});
