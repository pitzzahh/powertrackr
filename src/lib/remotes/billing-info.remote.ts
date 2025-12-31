import { query, form, command } from "$app/server";

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
  BillingSummary,
} from "$/types/billing-info";
import { eq } from "drizzle-orm";
import { requireAuth } from "$/server/auth";

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

// Query to get billing summary for a user
export const getBillingSummary = query(
  getBillingInfosSchema,
  async ({ userId }): Promise<BillingSummary> => {
    const extendedInfos = await db.query.billingInfo.findMany({
      where: { userId },
      with: {
        payment: true,
        subPayment: true,
      },
      orderBy: { date: "desc" },
    });

    if (extendedInfos.length === 0) {
      return {
        current: 0,
        invested: 0,
        totalReturns: 0,
        netReturns: 0,
        oneDayReturns: 0,
        averageDailyReturn: 0,
        averageMonthlyReturn: 0,
      };
    }

    const latest = extendedInfos[0];
    const current = latest?.balance ?? 0;
    const invested = extendedInfos.reduce(
      (sum, info) =>
        sum + ((info.payment?.amount ?? 0) + (info.subPayment?.amount ?? 0)),
      0,
    );
    const totalReturns = extendedInfos.reduce(
      (sum, info) => sum + (info.subPayment?.amount ?? 0),
      0,
    );
    const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
    const oneDayReturns = latest?.subPayment?.amount ?? 0;

    const firstDate = new Date(extendedInfos[extendedInfos.length - 1].date);
    const lastDate = new Date(latest.date);
    const totalDays = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const averageDailyReturn = totalReturns / totalDays;
    const totalMonths = totalDays / 30;
    const averageMonthlyReturn = totalReturns / totalMonths;

    return {
      current,
      invested,
      totalReturns,
      netReturns,
      oneDayReturns,
      averageDailyReturn,
      averageMonthlyReturn,
    };
  },
);

// Form to create a new billing info
export const createBillingInfo = form(
  billFormSchema,
  async (data): Promise<BillingInfo> => {
    const { session } = requireAuth();

    const userId = session.userId;

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
