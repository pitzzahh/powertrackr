import { query, form, command } from "$app/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "$lib/server/db/index";
import { payment } from "$lib/server/db/schema/payment";
import {
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentSchema,
  deletePaymentSchema,
} from "$lib/schemas/payment";

// Query to get all payments
export const getPayments = query(z.object({}), async () => {
  return await db.query.payment.findMany();
});

// Query to get a single payment by id
export const getPayment = query(getPaymentSchema, async (id) => {
  return await db.query.payment.findFirst({ where: { id } });
});

// Form to create a new payment
export const createPayment = form(createPaymentSchema, async (data) => {
  const id = crypto.randomUUID();
  const result = await db
    .insert(payment)
    .values({ id, ...data })
    .returning();
  return result[0];
});

// Form to update an existing payment
export const updatePayment = form(updatePaymentSchema, async (data) => {
  const { id, ...updateData } = data;
  const result = await db.update(payment).set(updateData).where(eq(payment.id, id)).returning();
  return result[0];
});

// Command to delete a payment
export const deletePayment = command(deletePaymentSchema, async ({ id }) => {
  await db.delete(payment).where(eq(payment.id, id));
});
