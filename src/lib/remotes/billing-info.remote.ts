import { query, form, command, getRequestEvent } from "$app/server";

import { db } from "$lib/server/db/index";
import { billingInfo } from "$lib/server/db/schema/billing-info";
import { payment } from "$lib/server/db/schema/payment";
import { calculatePayPerKwh } from "$lib";

import {
  billFormSchema,
  updateBillingInfoSchema,
  getBillingInfosSchema,
  getBillingInfoSchema,
  deleteBillingInfoSchema,
} from "$lib/schemas/billing-info";
import type {
  NewBillingInfo,
  BillingInfo,
  ExtendedBillingInfo,
} from "$/types/billing-info";
import { eq } from "drizzle-orm";

// Query to get all billing infos for a user
export const getBillingInfos = query(
  getBillingInfosSchema,
  async ({ userId }): Promise<BillingInfo[]> => {
    return await db.query.billingInfo.findMany({ where: { userId } });
  },
);

// Query to get extended billing infos with payments for a user
export const getExtendedBillingInfos = query(
  getBillingInfosSchema,
  async ({ userId }): Promise<ExtendedBillingInfo[]> => {
    return await db.query.billingInfo.findMany({
      where: { userId },
      with: {
        payment: true,
        subPayment: true,
      },
    });
  },
);

// Query to get a single billing info by id
export const getBillingInfo = query(
  getBillingInfoSchema,
  async (id): Promise<BillingInfo | undefined> => {
    return await db.query.billingInfo.findFirst({ where: { id } });
  },
);

// Form to create a new billing info
export const createBillingInfo = form(
  billFormSchema,
  async (data): Promise<BillingInfo> => {
    const event = getRequestEvent();
    // @ts-expect-error - auth will be set up later
    const session = await event.locals.auth.validate();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.userId;

    const { date, totalKwh, balance, status: statusBool, subReading } = data;

    const payPerKwh = calculatePayPerKwh(balance, totalKwh);

    // Get the latest billing info for the user
    const latest = await db.query.billingInfo.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const subReadingOld = latest?.subReadingLatest ?? null;
    const subKwh =
      subReading && subReadingOld ? subReading - subReadingOld : null;
    const subPaymentAmount = subKwh ? subKwh * payPerKwh : null;

    let paymentId = null;
    let subPaymentId = null;

    if (subPaymentAmount) {
      await db.transaction(async (tx) => {
        const subPayId = crypto.randomUUID();
        await tx
          .insert(payment)
          .values({ id: subPayId, amount: subPaymentAmount });

        const payId = crypto.randomUUID();
        await tx
          .insert(payment)
          .values({ id: payId, amount: balance - subPaymentAmount });

        paymentId = payId;
        subPaymentId = subPayId;
      });
    }

    const id = crypto.randomUUID();
    const insertData: NewBillingInfo = {
      id,
      userId,
      date,
      totalKwh,
      balance,
      status: statusBool ? "Paid" : "Pending",
      payPerKwh,
      subReadingLatest: subReading,
      subReadingOld,
      subKwh,
      paymentId,
      subPaymentId,
    };
    const [result] = await db
      .insert(billingInfo)
      .values(insertData)
      .returning();

    return result;
  },
);

// Form to update an existing billing info
export const updateBillingInfo = form(
  updateBillingInfoSchema,
  async (data): Promise<BillingInfo> => {
    const { id, ...updateData } = data;
    const [result] = await db
      .update(billingInfo)
      .set({
        ...updateData,
        subReadingLatest: updateData.subReading!,
      })
      .where(eq(billingInfo.id, id))
      .returning();
    return result;
  },
);

// Command to delete a billing info
export const deleteBillingInfo = command(
  deleteBillingInfoSchema,
  async ({ id }) => {
    await db.delete(billingInfo).where(eq(billingInfo.id, id));
  },
);
