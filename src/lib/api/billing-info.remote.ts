import { query, form, command } from "$app/server";
import { db } from "$lib/server/db/index";
import { calculatePayPerKwh } from "$lib";
import {
  billFormSchema,
  updateBillingInfoSchema,
  getBillingInfosSchema,
  getBillingInfoSchema,
  deleteBillingInfoSchema,
  deleteBillingInfoSchemaBatch,
} from "$lib/schemas/billing-info";
import type { BillingInfo, BillingSummary, NewBillingInfo } from "$/types/billing-info";
import { requireAuth } from "$/server/auth";
import {
  addBillingInfo,
  updateBillingInfoBy as updateBillingInfoCrud,
  getBillingInfoBy as getBillingInfoByCrud,
  getBillingInfoCountBy,
  deleteBillingInfoBy,
} from "$/server/crud/billing-info-crud";
import { addPayment } from "$/server/crud/payment-crud";
import { error, invalid } from "@sveltejs/kit";
import type { NewSubMeter } from "$/types/sub-meter";
import { addSubMeter, deleteSubMeterBy, updateSubMeterBy } from "$/server/crud/sub-meter-crud";
import { updatePaymentBy } from "$/server/crud/payment-crud";
import type { HelperResult } from "$/server/types/helper";

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

export const getLatestBillingInfo = query(getBillingInfosSchema, async ({ userId }) => {
  return await getBillingInfoByCrud({
    query: { userId },
    options: {
      fields: COMMON_FIELDS,
      with_sub_meters: true,
      order: "desc",
      limit: 1,
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
      order: "desc",
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
export const createBillingInfo = form(
  billFormSchema,
  async (data, issues): Promise<BillingInfo> => {
    const {
      session: { userId },
    } = requireAuth();

    const { date, totalkWh, balance, status, subMeters } = data;
    const payPerkWh = calculatePayPerKwh(balance, totalkWh);

    const { value: billingInfoCount } = await getBillingInfoCountBy({
      query: { userId },
      options: { limit: 1 },
    });

    const {
      valid: validLatestBillingInfo,
      value: [latestBillingInfo],
    } = await getBillingInfoByCrud({
      query: { userId },
      options: {
        with_sub_meters: true,
        order: "desc",
        limit: 1,
      },
    });

    if (billingInfoCount > 0 && !validLatestBillingInfo) {
      throw error(400, "Failed to add new billing info, cannot get previous billing info");
    }

    // Process multiple sub meters
    const subMetersData = subMeters.map((sub) => {
      const currentMeter = latestBillingInfo?.subMeters?.find((m) => m.label === sub.label);
      // Assume previous reading is 0 if no matching sub meter exists (flexible for new sub meters)
      const previousReading = currentMeter?.reading || 0;
      const subkWh = sub.reading - previousReading;
      if (subkWh < 0) {
        throw error(400, `Invalid reading for sub meter "${sub.label}"`);
      }
      const paymentAmount = Number((subkWh * payPerkWh).toFixed(2));
      return {
        label: sub.label,
        reading: sub.reading,
        subkWh,
        paymentAmount,
      };
    });

    const { totalSubPaymentAmount, totalSubkWh } = {
      totalSubPaymentAmount: subMetersData
        .map((s) => s.paymentAmount)
        .reduce((sum, amount) => sum + amount, 0),
      totalSubkWh: subMetersData.map((e) => e.subkWh).reduce((sum, kWh) => sum + kWh, 0),
    };

    const mainPaymentAmount = Number((balance - totalSubPaymentAmount).toFixed(2));
    if (mainPaymentAmount < 0) {
      throw error(400, "Main payment amount cannot be negative");
    }

    const mainTotalkWhUsed = totalkWh - totalSubkWh;

    if (mainTotalkWhUsed + totalSubkWh != totalkWh) {
      invalid(
        issues.subMeters("Invalid meter readings, computed kWh usage does not meet total kWh usage")
      );
    }

    const subMeterInserts: Omit<NewSubMeter, "id">[] = [];
    const result = await db.transaction(async (tx) => {
      let {
        valid: validMainPayment,
        value: [mainPayment],
      } = await addPayment([{ amount: mainPaymentAmount, date: new Date() }], tx);

      if (!validMainPayment) {
        tx.rollback();
        throw error(400, "Failed to add billing info, main payment not processed");
      }

      const {
        valid: validBillingInfo,
        value: [result],
      } = await addBillingInfo(
        [
          {
            userId,
            date: new Date(date),
            totalkWh,
            balance,
            status,
            payPerkWh,
            paymentId: mainPayment.id,
          },
        ],
        tx
      );

      if (!validBillingInfo) {
        tx.rollback();
        throw error(400, "Failed to add billing info, billing info not processed");
      }
      // Create sub payments and prepare sub meters
      for (const subData of subMetersData) {
        const {
          valid: validPayment,
          value: [addedPayment],
          message,
        } = await addPayment(
          [
            {
              amount: subData.paymentAmount,
            },
          ],
          tx
        );
        if (!validPayment) {
          tx.rollback();
          throw error(500, `Failed to create sub payment: ${message || "Unknown reason"}`);
        }
        subMeterInserts.push({
          billingInfoId: result.id,
          label: subData.label,
          subkWh: subData.subkWh,
          reading: subData.reading,
          paymentId: addedPayment.id,
        });
      }
      return result;
    });

    // Add sub meters
    await addSubMeter(subMeterInserts);
    getExtendedBillingInfos({
      userId,
    }).refresh();
    return result;
  }
);

// Form to update an existing billing info with multiple sub meters
export const updateBillingInfo = form(
  updateBillingInfoSchema,
  async (data): Promise<BillingInfo> => {
    const { session } = requireAuth();
    const { id: billingInfoId, subMeters, ...updateData } = data;
    console.log(JSON.stringify(data, null, 2));
    const {
      valid: validBillingInfo,
      value: [billingInfoWithSubMetersToUpdate],
    } = await getBillingInfoByCrud({
      query: { userId: session.userId, id: billingInfoId },
      options: {
        fields: ["id", "date", "paymentId"],
        with_sub_meters_with_payment: true,
      },
    });

    if (!validBillingInfo) {
      throw error(400, "Failed to update billing info");
    }

    // Prepare sub meters data first (compute without DB calls)
    const payPerkWh = calculatePayPerKwh(
      updateData.balance ?? billingInfoWithSubMetersToUpdate.balance,
      updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh
    );
    let subMetersData =
      subMeters?.map((sub) => {
        if (sub.id) {
          const currentMeter = billingInfoWithSubMetersToUpdate.subMeters?.find(
            (m) => m.id === sub.id
          );
          if (!currentMeter) {
            throw error(400, `Sub meter with id "${sub.id}" not found`);
          }
          const subkWh = sub.reading - currentMeter.reading;
          if (subkWh < 0) {
            throw error(400, `Invalid reading for sub meter "${sub.label}"`);
          }
          const paymentAmount = Number((subkWh * payPerkWh).toFixed(2));
          return {
            id: sub.id,
            label: sub.label,
            reading: sub.reading,
            subkWh,
            paymentAmount,
            paymentId: currentMeter.paymentId,
          };
        } else {
          // new sub meter
          const subkWh = sub.reading; // from 0
          const paymentAmount = Number((subkWh * payPerkWh).toFixed(2));
          return {
            label: sub.label,
            reading: sub.reading,
            subkWh,
            paymentAmount,
          };
        }
      }) ?? [];

    // Perform all DB operations in a transaction
    const result = await db.transaction(async (tx) => {
      // Update the main billing info
      const {
        valid: validBillingInfoUpdate,
        value: [updatedBillingInfo],
      } = await updateBillingInfoCrud(
        { query: { id: billingInfoId }, options: { tx } },
        {
          ...updateData,
          date: new Date(updateData.date),
        }
      );

      if (!validBillingInfoUpdate || !updatedBillingInfo) {
        tx.rollback();
        throw error(400, "Failed to update billing info");
      }

      // Handle sub meters update if provided
      if (subMeters) {
        const existingIds = billingInfoWithSubMetersToUpdate.subMeters?.map((s) => s.id) || [];
        const providedIds = subMeters.filter((s) => s.id !== undefined).map((s) => s.id!);
        const toDeleteIds = existingIds.filter((id) => !providedIds.includes(id));

        if (toDeleteIds.length > 0) {
          await Promise.all(
            toDeleteIds.map((id) => deleteSubMeterBy({ query: { id }, options: { tx } }))
          );
        }

        for (const subData of subMetersData) {
          if (subData.id) {
            // update existing
            await updateSubMeterBy(
              {
                query: {
                  id: subData.id,
                },
                options: { tx },
              },
              {
                reading: subData.reading,
                subkWh: subData.subkWh,
              }
            );

            await updatePaymentBy(
              { query: { id: subData.paymentId }, options: { tx } },
              { amount: subData.paymentAmount }
            );
          } else {
            // add new
            const {
              valid: validSubPayment,
              value: [{ id: paymentId }],
            } = await addPayment(
              [
                {
                  date: new Date(),
                  amount: subData.paymentAmount,
                },
              ],
              tx
            );
            if (!validSubPayment) {
              tx.rollback();
              throw error(400, "Failed to add sub payment");
            }
            const subMeterInserts = [
              {
                label: subData.label,
                billingInfoId,
                reading: subData.reading,
                subkWh: subData.subkWh,
                paymentId,
              },
            ];
            const { valid: validSubMeterInsert } = await addSubMeter(subMeterInserts, tx);
            if (!validSubMeterInsert) {
              tx.rollback();
              throw error(400, "Failed to add sub meters");
            }
          }
        }
      }

      if (!billingInfoWithSubMetersToUpdate.paymentId) {
        tx.rollback();
        throw error(400, "Billing info missing payment ID");
      }

      const totalSubPayment = subMeters
        ? subMetersData.reduce((sum, sub) => sum + sub.paymentAmount, 0)
        : (billingInfoWithSubMetersToUpdate.subMeters || []).reduce(
            (sum, sub) => sum + (sub.payment?.amount ?? 0),
            0
          );

      const mainPaymentAmount = (updatedBillingInfo.balance ?? 0) - totalSubPayment;
      if (mainPaymentAmount < 0) {
        tx.rollback();
        throw error(400, "Main payment amount cannot be negative");
      }

      const { valid: validMainPaymentUpdate } = await updatePaymentBy(
        { query: { id: billingInfoWithSubMetersToUpdate.paymentId }, options: { tx } },
        {
          amount: mainPaymentAmount,
        }
      );

      if (!validMainPaymentUpdate) {
        tx.rollback();
        throw error(400, "Failed to update main payment");
      }

      return updatedBillingInfo;
    });

    return result;
  }
);

// Command to delete a billing info
export const deleteBillingInfo = command(deleteBillingInfoSchema, async ({ id }) => {
  const {
    session: { userId },
  } = requireAuth();

  const result = await deleteBillingInfoBy({ query: { id } });

  if (result.value === 1) {
    getExtendedBillingInfos({ userId }).refresh();
  }

  return result;
});

export const deleteBillingInfoBatch = command(
  deleteBillingInfoSchemaBatch,
  async ({ ids, count }) => {
    const {
      session: { userId },
    } = requireAuth();

    const validCount = (
      await Promise.all(ids.map((id) => deleteBillingInfoBy({ query: { id } })))
    ).filter((result) => result.valid).length;

    if (validCount === count) {
      console.log("Refreshing data");
      getExtendedBillingInfos({ userId }).refresh();
    }

    return {
      valid: validCount === count,
      value: validCount,
      message: `${validCount} item(s) deleted successfully`,
    } as HelperResult<number>;
  }
);
