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
import type { BillingInfo, BillingSummary } from "$/types/billing-info";
import { eq } from "drizzle-orm";
import { requireAuth } from "$/server/auth";
import {
  addBillingInfo,
  getBillingInfoBy as getBillingInfoByCrud,
} from "$/server/crud/billing-info-crud";
import { addPayment } from "$/server/crud/payment-crud";
import { error } from "@sveltejs/kit";

const COMMON_FIELDS: (keyof BillingInfo)[] = [
  "id",
  "userId",
  "date",
  "totalkWh",
  "balance",
  "status",
  "payPerkWh",
  "paymentId",
  "createdAt",
  "updatedAt",
] as const;
// Query to get all billing infos for a user
export const getBillingInfoBy = query(getBillingInfosSchema, async ({ userId }) => {
  return await getBillingInfoByCrud({
    query: { userId },
    options: {
      fields: COMMON_FIELDS,
    },
  });
});

// Query to get extended billing infos with payments for a user
export const getExtendedBillingInfos = query(getBillingInfosSchema, async ({ userId }) => {
  return await getBillingInfoByCrud({
    query: { userId },
    options: {
      fields: COMMON_FIELDS,
      with_payment: true,
      with_sub_meters_with_payment: true,
    },
  });
});

// Query to get a single billing info by id
export const getBillingInfo = query(getBillingInfoSchema, async (id) => {
  return await getBillingInfoByCrud({
    query: { id },
    options: {
      fields: [
        "id",
        "userId",
        "date",
        "totalkWh",
        "balance",
        "status",
        "payPerkWh",
        "paymentId",
        "createdAt",
        "updatedAt",
      ],
    },
  });
});

// Query to get billing summary for a user
export const getBillingSummary = query(
  getBillingInfosSchema,
  async ({ userId }): Promise<BillingSummary> => {
    const result = await getExtendedBillingInfos({ userId });
    const extendedInfos = result.value as any;

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

    const latest: any = extendedInfos[0];
    const current = latest?.balance ?? 0;
    const invested = extendedInfos.reduce(
      (sum: number, info: any) =>
        sum +
        ((info.payment?.amount ?? 0) +
          info.subMeters?.reduce(
            (subSum: number, sub: any) => subSum + (sub.payment?.amount ?? 0),
            0
          )),
      0
    );
    const totalReturns = extendedInfos.reduce(
      (sum: number, info: any) =>
        sum +
        info.subMeters.reduce((subSum: number, sub: any) => subSum + (sub.payment?.amount ?? 0), 0),
      0
    );
    const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
    const oneDayReturns = latest.subMeters.reduce(
      (sum: number, sub: any) => sum + (sub.payment?.amount ?? 0),
      0
    );

    const firstDate = new Date(extendedInfos[extendedInfos.length - 1].date as string);
    const lastDate = new Date(latest.date as string);
    const totalDays = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
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
  }
);

// Form to create a new billing info with multiple sub meters
export const createBillingInfo = form(billFormSchema, async (data): Promise<BillingInfo> => {
  const { session } = requireAuth();

  console.debug(JSON.stringify(data, null, 2));

  const userId = session!.userId;

  const { date, totalkWh, balance, status: statusBool, subMeters } = data;

  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  // Process multiple sub meters
  const subMetersData = subMeters.map((sub) => ({
    subReadingLatest: sub.subReadingLatest,
    subReadingOld: sub.subReadingOld ?? null,
    subKwh: sub.subReadingOld ? sub.subReadingLatest - sub.subReadingOld : null,
    paymentAmount: sub.subReadingOld
      ? (sub.subReadingLatest - sub.subReadingOld) * payPerkWh
      : null,
  }));

  const totalSubPaymentAmount = subMetersData.reduce(
    (sum, sub) => sum + (sub.paymentAmount || 0),
    0
  );

  let {
    valid: validMainPayment,
    value: [mainPayment],
  } = await addPayment([{ amount: balance - totalSubPaymentAmount }]);

  if (!validMainPayment) {
    error(400, "Failed to add billing info, main payment not processed");
  }

  const {
    valid: validBillingInfo,
    value: [result],
  } = await addBillingInfo([
    {
      userId,
      date,
      totalkWh,
      balance,
      status: statusBool ? "Paid" : "Pending",
      payPerkWh,
      paymentId: mainPayment.id,
    },
  ]);

  if (!validBillingInfo) {
    error(400, "Failed to add billing info, billing info not processed");
  }

  const subMeterInserts: {
    billingInfoId: string;
    subKwh: number | null;
    subReadingLatest: number | null;
    subReadingOld: number | null;
    paymentId: string | null;
  }[] = [];
  await db.transaction(async (tx) => {
    // Create sub payments and prepare sub meters
    for (const subData of subMetersData) {
      if (subData.paymentAmount && subData.paymentAmount > 0) {
        const subPayId = crypto.randomUUID();
        const addResult = await tx
          .insert(payment)
          .values({ id: subPayId, amount: subData.paymentAmount });
        subMeterInserts.push({
          billingInfoId: "", // will set after billing created
          subKwh: subData.subKwh,
          subReadingLatest: subData.subReadingLatest,
          subReadingOld: subData.subReadingOld,
          paymentId: subPayId,
        });
        if (addResult.rowsAffected === 0) tx.rollback();
      } else {
        // Sub meter without payment (just tracking)
        subMeterInserts.push({
          billingInfoId: "", // will set after billing created
          subKwh: subData.subKwh,
          subReadingLatest: subData.subReadingLatest,
          subReadingOld: subData.subReadingOld,
          paymentId: null,
        });
      }
    }
  });

  // Insert sub meters (if any)
  if (subMeterInserts.length > 0) {
    await db.insert(subMeter).values(
      subMeterInserts.map((sub) => ({
        ...sub,
        id: crypto.randomUUID(),
        billingInfoId: result.id,
      }))
    );
  }

  return result;
});

// Form to update an existing billing info with multiple sub meters
export const updateBillingInfo = form(
  updateBillingInfoSchema,
  async (data): Promise<BillingInfo> => {
    const { id, subMeters, ...updateData } = data;

    // Update the main billing info
    const [result] = await db
      .update(billingInfo)
      .set(updateData)
      .where(eq(billingInfo.id, id))
      .returning();

    // Handle sub meters update if provided
    if (subMeters !== undefined) {
      // For simplicity, we'll replace all sub meters for this billing info
      // In a more complex implementation, you might want to do diff-based updates
      await db.delete(subMeter).where(eq(subMeter.billingInfoId, id));

      if (subMeters.length > 0) {
        const payPerkWh = calculatePayPerKwh(result.balance, result.totalkWh);

        const subMeterInserts = subMeters.map((sub) => {
          const subKwh = sub.subReadingOld ? sub.subReadingLatest - sub.subReadingOld : null;
          const paymentAmount = subKwh ? subKwh * payPerkWh : null;

          return {
            id: crypto.randomUUID(),
            billingInfoId: id,
            subKwh,
            subReadingLatest: sub.subReadingLatest,
            subReadingOld: sub.subReadingOld ?? null,
            paymentId: paymentAmount ? crypto.randomUUID() : null,
          };
        });

        // Insert new sub meters
        await db.insert(subMeter).values(subMeterInserts);

        // Create payments for sub meters that have payment amounts
        for (const sub of subMeterInserts) {
          if (sub.paymentId) {
            const subKwh = sub.subKwh!;
            const paymentAmount = subKwh * payPerkWh;
            await db.insert(payment).values({
              id: sub.paymentId,
              amount: paymentAmount,
            });
          }
        }
      }
    }

    return result;
  }
);

// Command to delete a billing info
export const deleteBillingInfo = command(deleteBillingInfoSchema, async ({ id }) => {
  await db.delete(billingInfo).where(eq(billingInfo.id, id));
});
