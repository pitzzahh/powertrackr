import { query, form, command } from "$app/server";

import { db } from "$lib/server/db/index";
import { billingInfo } from "$lib/server/db/schema/billing-info";
import { payment } from "$lib/server/db/schema/payment";
import { subMeter } from "$lib/server/db/schema/sub-meter";
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
    return await db.query.billingInfo.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
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
        subMeters: {
          with: {
            payment: true,
          },
        },
      },
      orderBy: { date: "desc" },
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
        subMeters: {
          with: {
            payment: true,
          },
        },
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
        sum +
        ((info.payment?.amount ?? 0) +
          info.subMeters.reduce(
            (subSum, sub) => subSum + (sub.payment?.amount ?? 0),
            0,
          )),
      0,
    );
    const totalReturns = extendedInfos.reduce(
      (sum, info) =>
        sum +
        info.subMeters.reduce(
          (subSum, sub) => subSum + (sub.payment?.amount ?? 0),
          0,
        ),
      0,
    );
    const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
    const oneDayReturns = latest.subMeters.reduce(
      (sum, sub) => sum + (sub.payment?.amount ?? 0),
      0,
    );

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

    const userId = session!.userId;

    const { date, totalKwh, balance, status: statusBool, subReadings } = data;

    const payPerKwh = calculatePayPerKwh(balance, totalKwh);

    const subReadingOld = null; // Since subReadingLatest is now per subMeter
    const subMetersData =
      subReadings?.map((subReading) => {
        const subKwh =
          subReading && subReadingOld ? subReading - subReadingOld : null;
        const subPaymentAmount = subKwh ? subKwh * payPerKwh : null;
        return {
          subReadingLatest: subReading,
          subReadingOld,
          subKwh,
          paymentAmount: subPaymentAmount,
        };
      }) || [];

    const totalSubPaymentAmount = subMetersData.reduce(
      (sum, sub) => sum + (sub.paymentAmount || 0),
      0,
    );

    let paymentId = null;
    const subMeterInserts: {
      billingInfoId: string;
      subKwh: number | null;
      subReadingLatest: number | null;
      subReadingOld: number | null;
      paymentId: string | null;
    }[] = [];

    await db.transaction(async (tx) => {
      // Create main payment
      const payId = crypto.randomUUID();
      await tx
        .insert(payment)
        .values({ id: payId, amount: balance - totalSubPaymentAmount });
      paymentId = payId;

      // Create sub payments and sub meters
      for (const subData of subMetersData) {
        if (subData.paymentAmount) {
          const subPayId = crypto.randomUUID();
          await tx
            .insert(payment)
            .values({ id: subPayId, amount: subData.paymentAmount });
          subMeterInserts.push({
            billingInfoId: "", // will set after billing created
            subKwh: subData.subKwh,
            subReadingLatest: subData.subReadingLatest,
            subReadingOld: subData.subReadingOld,
            paymentId: subPayId,
          });
        }
      }
    });

    const id = crypto.randomUUID();
    const insertData: NewBillingInfo = {
      id,
      userId,
      date,
      totalKwh,
      balance,
      status: statusBool ? "Paid" : "Pending",
      payPerKwh,
      paymentId,
    };
    const [result] = await db
      .insert(billingInfo)
      .values(insertData)
      .returning();

    // Insert sub meters
    if (subMeterInserts.length > 0) {
      await db.insert(subMeter).values(
        subMeterInserts.map((sub) => ({
          ...sub,
          id: crypto.randomUUID(),
          billingInfoId: result.id,
        })),
      );
    }

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
      .set(updateData)
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
