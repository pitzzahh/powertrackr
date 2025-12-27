import { query, form, command } from "$app/server";
import { eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "$lib/server/db/index";
import { billingInfo } from "$lib/server/db/schema/billing-info";
import { payment } from "$lib/server/db/schema/payment";

import {
  createBillingInfoSchema,
  updateBillingInfoSchema,
  getBillingInfosSchema,
  getBillingInfoSchema,
  deleteBillingInfoSchema,
} from "$lib/schemas/billing-info";

// Query to get all billing infos for a user
export const getBillingInfos = query(
  getBillingInfosSchema,
  async ({ userId }) => {
    return await db
      .select()
      .from(billingInfo)
      .where(eq(billingInfo.userId, userId));
  },
);

// Query to get extended billing infos with payments for a user
export const getExtendedBillingInfos = query(
  getBillingInfosSchema,
  async ({ userId }) => {
    const subPaymentAlias = alias(payment, "subPayment");
    return await db
      .select({
        ...getTableColumns(billingInfo),
        payment: getTableColumns(payment),
        subPayment: getTableColumns(subPaymentAlias),
      })
      .from(billingInfo)
      .leftJoin(payment, eq(billingInfo.paymentId, payment.id))
      .leftJoin(
        subPaymentAlias,
        eq(billingInfo.subPaymentId, subPaymentAlias.id),
      )
      .where(eq(billingInfo.userId, userId));
  },
);

// Query to get a single billing info by id
export const getBillingInfo = query(getBillingInfoSchema, async (id) => {
  const result = await db
    .select()
    .from(billingInfo)
    .where(eq(billingInfo.id, id));
  return result[0] || null;
});

// Form to create a new billing info
export const createBillingInfo = form(createBillingInfoSchema, async (data) => {
  const id = crypto.randomUUID();
  const result = await db
    .insert(billingInfo)
    .values({ id, ...data })
    .returning();
  return result[0];
});

// Form to update an existing billing info
export const updateBillingInfo = form(updateBillingInfoSchema, async (data) => {
  const { id, ...updateData } = data;
  const result = await db
    .update(billingInfo)
    .set(updateData)
    .where(eq(billingInfo.id, id))
    .returning();
  return result[0];
});

// Command to delete a billing info
export const deleteBillingInfo = command(
  deleteBillingInfoSchema,
  async ({ id }) => {
    await db.delete(billingInfo).where(eq(billingInfo.id, id));
  },
);
