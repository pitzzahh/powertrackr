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
import type { BillingInfo, BillingSummary, NewBillingInfo } from "$/types/billing-info";
import { eq } from "drizzle-orm";
import { requireAuth } from "$/server/auth";
import {
  addBillingInfo,
  updateBillingInfoBy as updateBillingInfoCrud,
  getBillingInfoBy as getBillingInfoByCrud,
  getBillingInfoCountBy,
} from "$/server/crud/billing-info-crud";
import { addPayment } from "$/server/crud/payment-crud";
import { error } from "@sveltejs/kit";
import type { NewSubMeter } from "$/types/sub-meter";
import { addSubMeter } from "$/server/crud/sub-meter-crud";
import { getLocalTimeZone } from "@internationalized/date";

const COMMON_FIELDS: (keyof NewBillingInfo)[] = [
  "id",
  "userId",
  "date",
  "totalkWh",
  "balance",
  "status",
  "payPerkWh",
  "paymentId",
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
      fields: COMMON_FIELDS,
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

  const { valid: validCount, value: billingInfoCount } = await getBillingInfoCountBy({
    query: { userId: session.userId },
    options: { limit: 1 },
  });

  if (!validCount) {
    error(400, "Failed to add billing info, cannot get total count");
  }

  const {
    valid: validLatestBillingInfo,
    value: [latestBillingInfo],
  } = await getBillingInfoByCrud({
    query: { userId: session.userId },
    options: {
      with_sub_meters: true,
      order: "desc",
      limit: 1,
    },
  });

  if (billingInfoCount > 0 && !validLatestBillingInfo) {
    error(400, "Failed to add billing info, cannot get previous billing info");
  }

  const userId = session!.userId;

  const { date, totalkWh, balance, status, subMeters } = data;

  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  // Process multiple sub meters
  const subMetersData = subMeters.map((sub) => {
    const currentMeter = latestBillingInfo.subMeters?.find((m) => m.label === sub.label);
    if (!currentMeter) {
      error(400, "Sub meter not found in latest billing info");
    }
    const subkWh = currentMeter.reading - sub.reading;
    return {
      label: sub.label,
      reading: sub.reading,
      subkWh,
      paymentAmount: subkWh * payPerkWh,
    };
  });

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
      date: new Date(date),
      totalkWh,
      balance,
      status,
      payPerkWh,
      paymentId: mainPayment.id,
    },
  ]);

  if (!validBillingInfo) {
    error(400, "Failed to add billing info, billing info not processed");
  }

  const subMeterInserts: Omit<NewSubMeter, "id">[] = [];
  await db.transaction(async (tx) => {
    // Create sub payments and prepare sub meters
    for (const subData of subMetersData) {
      const subPayId = crypto.randomUUID();
      const addResult = await tx
        .insert(payment)
        .values({ id: subPayId, amount: subData.paymentAmount });
      subMeterInserts.push({
        billingInfoId: "", // will set after billing created
        label: subData.label,
        subkWh: subData.subkWh,
        reading: subData.reading,
        paymentId: subPayId,
      });
      if (addResult.rowCount === 0) tx.rollback();
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
    const { session } = requireAuth();
    const { id: billingInfoId, subMeters, ...updateData } = data;

    const {
      valid: validBillingInfo,
      value: [billingInfoWithSubMetersToUpdate],
    } = await getBillingInfoByCrud({
      query: { userId: session.userId, id: billingInfoId },
      options: {
        fields: ["id", "date"],
        with_billing_info: true,
      },
    });

    if (!validBillingInfo) {
      error(400, "Failed to update billing info, ");
    }

    // Update the main billing info
    const {
      valid: validBillingInfoUpdate,
      value: [updatedBillingInfo],
    } = await updateBillingInfoCrud(
      { query: { id: billingInfoId } },
      {
        ...updateData,
        date: new Date(updateData.date),
      }
    );

    if (!validBillingInfoUpdate) {
      error(400, "Failed to update billing info");
    }

    // Handle sub meters update if provided
    if (subMeters.length > 0) {
      const payPerkWh = calculatePayPerKwh(updatedBillingInfo.balance, updatedBillingInfo.totalkWh);

      const subMeterInserts = await Promise.all(
        subMeters.map(async (sub) => {
          const currentMeter = billingInfoWithSubMetersToUpdate.subMeters?.find(
            (m) => m.label === sub.label
          );

          if (!currentMeter) {
            error(400, "Sub meter not found in latest billing info");
          }

          const subkWh = currentMeter.reading - sub.reading;
          const paymentAmount = subkWh * payPerkWh;

          const {
            valid: validSubPayment,
            value: [{ id: paymentId }],
          } = await addPayment([
            {
              date: new Date(getLocalTimeZone()),
              amount: paymentAmount,
            },
          ]);

          if (!validSubPayment) {
            error(400, "Failed to add sub payment");
          }

          return {
            label: sub.label,
            billingInfoId,
            reading: sub.reading,
            subkWh,
            paymentId,
          };
        })
      );

      // Insert new sub meters
      await addSubMeter(subMeterInserts);
    }

    return updatedBillingInfo;
  }
);

// Command to delete a billing info
export const deleteBillingInfo = command(deleteBillingInfoSchema, async ({ id }) => {
  await db.delete(billingInfo).where(eq(billingInfo.id, id));
});
