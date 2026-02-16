import { query, form, command, getRequestEvent } from "$app/server";
import { db } from "$lib/server/db/index";
import { calculatePayPerKwh } from "$lib";
import {
  billFormSchema,
  updateBillingInfoSchema,
  getBillingInfosSchema,
  getBillingInfoSchema,
  deleteBillingInfoSchema,
  deleteBillingInfoSchemaBatch,
  generateRandomBillingInfosSchema,
} from "$/validators/billing-info";
import type {
  BillingInfo,
  BillingInfoWithPaymentAndSubMetersWithPayment,
  BillingSummary,
  NewBillingInfo,
} from "$/types/billing-info";
import { requireAuth } from "$/server/auth";
import {
  updateBillingInfoBy as updateBillingInfoCrud,
  getBillingInfoBy as getBillingInfoByCrud,
  getBillingInfoCountBy,
  deleteBillingInfoBy,
  createBillingInfoLogic,
  getTotalEnergyUsage as getTotalEnergyUsageCrud,
} from "$/server/crud/billing-info-crud";
import { getChangedData, omit } from "$/utils/mapper";
import { addPayment } from "$/server/crud/payment-crud";
import { error, invalid } from "@sveltejs/kit";
import { addSubMeter, deleteSubMeterBy, updateSubMeterBy } from "$/server/crud/sub-meter-crud";
import { updatePaymentBy } from "$/server/crud/payment-crud";
import type { HelperResult } from "$/server/types/helper";
import { dev } from "$app/environment";

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

// Query to get total energy usage (summed totalKwh) for a user, formatted
// Public endpoint with origin check - only allows requests from same origin
export const getTotalEnergyUsage = query(async () => {
  const event = getRequestEvent();
  const origin = event.request.headers.get("origin");
  const referer = event.request.headers.get("referer");
  const siteOrigin = event.url.origin;

  const isAllowedOrigin =
    origin === siteOrigin || origin === null || (referer && referer.startsWith(siteOrigin));

  if (!isAllowedOrigin) {
    throw error(403, "Forbidden");
  }

  return await getTotalEnergyUsageCrud();
});

// Query to get total billing info count
// Public endpoint with origin check - only allows requests from same origin
export const getTotalBillingInfoCount = query(async () => {
  const event = getRequestEvent();
  const origin = event.request.headers.get("origin");
  const referer = event.request.headers.get("referer");
  const siteOrigin = event.url.origin;

  const isAllowedOrigin =
    origin === siteOrigin || origin === null || (referer && referer.startsWith(siteOrigin));

  if (!isAllowedOrigin) {
    throw error(403, "Forbidden");
  }

  const result = await getBillingInfoCountBy({ query: {} });
  return result.value ?? 0;
});

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
    const extendedInfos = result.value as BillingInfoWithPaymentAndSubMetersWithPayment[];

    if (extendedInfos.length === 0) {
      return {
        current: 0,
        invested: 0,
        totalReturns: 0,
        netReturns: 0,
        oneDayReturns: 0,
        averageDailyReturn: 0,
        averageMonthlyReturn: 0,
        periodPaymentChange: 0,
        periodPaymentChangePct: 0,
      };
    }

    const latest = extendedInfos[0];
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
    const oneDayReturns =
      latest.subMeters?.reduce((sum: number, sub: any) => sum + (sub.payment?.amount ?? 0), 0) ?? 0;

    const firstDate = extendedInfos[extendedInfos.length - 1].date;
    const lastDate = latest.date;
    const totalDays = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDailyReturn = totalReturns / totalDays;
    const totalMonths = totalDays / 30;
    const averageMonthlyReturn = totalReturns / totalMonths;

    // period change (previous_totalPayment - latest_totalPayment)
    const totalPayment = (info: any) =>
      (info.payment?.amount ?? 0) +
      info.subMeters.reduce((subSum: number, sub: any) => subSum + (sub.payment?.amount ?? 0), 0);
    const latestTotalPayment = totalPayment(latest);
    const prevTotalPayment = extendedInfos[1] ? totalPayment(extendedInfos[1]) : latestTotalPayment;
    const periodPaymentChange = prevTotalPayment - latestTotalPayment;
    const periodPaymentChangePct =
      prevTotalPayment > 0 ? (periodPaymentChange / prevTotalPayment) * 100 : 0;

    return {
      current,
      invested,
      totalReturns,
      netReturns,
      oneDayReturns,
      averageDailyReturn,
      averageMonthlyReturn,
      periodPaymentChange,
      periodPaymentChangePct,
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

    try {
      const result = await createBillingInfoLogic(data, userId);
      getExtendedBillingInfos({
        userId,
      }).refresh();
      getLatestBillingInfo({
        userId,
      }).refresh();
      return result;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Invalid meter readings")) {
        invalid(issues.subMeters(err.message));
      }
      throw err;
    }
  }
);

// Form to generate random billing infos for testing
export const generateRandomBillingInfos = command(
  generateRandomBillingInfosSchema,
  async (data): Promise<HelperResult<number>> => {
    const {
      session: { userId },
    } = requireAuth();

    if (!dev) error(404, "Not found");

    const { count, minSubMeters, maxSubMeters } = data as {
      count: number;
      minSubMeters: number;
      maxSubMeters: number;
    };

    console.log("Generating random bills:", { count, minSubMeters, maxSubMeters });

    // Get latest billing info for sub meter readings
    const { valid: _validLatest, value: latestInfos } = await getExtendedBillingInfos({ userId });
    const latest = latestInfos[0];
    let subMeterReadings: Record<string, number> = {};
    if (latest) {
      latest.subMeters?.forEach((sub) => {
        subMeterReadings[sub.label] = sub.reading;
      });
    }

    // Generate sequential months from 2000 to current year
    const end = new Date();
    const totalYears = end.getFullYear() - 2000;
    const totalMonths = totalYears * 12 + end.getMonth() + 1;
    const monthsPerBill = totalMonths / count;

    let created = 0;
    console.log("Starting loop for", count, "bills");
    for (let i = 0; i < count; i++) {
      console.log("Creating bill", i + 1);
      const monthIndex = Math.floor(i * monthsPerBill);
      const year = 2000 + Math.floor(monthIndex / 12);
      const month = (monthIndex % 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid invalid dates
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const numSub = Math.floor(Math.random() * (maxSubMeters - minSubMeters + 1)) + minSubMeters;
      const totalkWh = Math.floor(Math.random() * 2000) + 1000 + numSub * 100; // 1000-3000 + buffer
      const balance = Math.floor(Math.random() * 2000) + 1000 + numSub * 100; // 1000-3000 + buffer
      const status = Math.random() > 0.5 ? "Paid" : "Pending";
      const subMeters = [];
      for (let j = 1; j <= numSub; j++) {
        const label = `Sub Meter ${j}`;
        const prevReading = subMeterReadings[label] || 0;
        const reading = prevReading + Math.floor(Math.random() * 50) + 10; // +10-60
        subMeters.push({ label, reading });
        subMeterReadings[label] = reading;
      }

      try {
        await createBillingInfoLogic(
          {
            date,
            totalkWh,
            balance,
            status,
            subMeters,
          },
          userId
        );
        created++;
        console.log("Created bill", i + 1);
      } catch (err) {
        console.error(`Failed to create billing info ${i + 1}:`, err);
      }
    }
    console.log("Created", created, "bills");

    getExtendedBillingInfos({ userId }).refresh();
    return {
      valid: true,
      value: created,
      message: `Generated ${created} random billing infos`,
    };
  }
);

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
        fields: ["id", "date", "status", "balance", "totalkWh", "paymentId"],
        with_payment: true,
        with_sub_meters_with_payment: true,
      },
    });

    if (!validBillingInfo) {
      throw error(400, "Failed to update billing info");
    }

    const updatedData = {
      ...updateData,
      date: new Date(updateData.date),
      ...(updateData.status && {
        status: updateData.status as string,
      }),
    };

    // Use the current billing info as-is for comparison.
    // Overriding `balance` with the payment amount can cause false-positive
    // change detection when the payment amount differs from the stored balance.
    const changed_data = getChangedData(
      omit(billingInfoWithSubMetersToUpdate, ["id", "createdAt", "updatedAt", "paymentId"]),
      updatedData
    );

    console.log({ billingInfoWithSubMetersToUpdate, changed_data });

    // Determine whether provided subMeters actually differ from existing ones
    // (cheap checks) so we can skip heavy work when they don't.
    const existingSubMeters = billingInfoWithSubMetersToUpdate.subMeters ?? [];
    let subMetersHaveChanges = false;
    if (subMeters !== undefined && subMeters !== null) {
      // If counts differ, there were additions/removals
      if ((subMeters.length ?? 0) !== (existingSubMeters.length ?? 0)) {
        subMetersHaveChanges = true;
      }
      // Quick scan: new items (no id) or any mismatch in id/label/reading
      if (!subMetersHaveChanges) {
        const providedIds = subMeters.filter((s) => s.id !== undefined).map((s) => s.id);
        for (const s of subMeters) {
          if (!s.id) {
            subMetersHaveChanges = true;
            break;
          }
          const existing = existingSubMeters.find((m) => m.id === s.id);
          if (!existing) {
            subMetersHaveChanges = true;
            break;
          }
          if (existing.label !== s.label || existing.reading !== s.reading) {
            subMetersHaveChanges = true;
            break;
          }
        }
        // Also detect deletions (an existing id not present in provided ids)
        if (!subMetersHaveChanges) {
          for (const existing of existingSubMeters) {
            if (!providedIds.includes(existing.id)) {
              subMetersHaveChanges = true;
              break;
            }
          }
        }
      }
    }

    if (Object.keys(changed_data).length === 0 && !subMetersHaveChanges) {
      console.info("Bail out, no changed data");
      return billingInfoWithSubMetersToUpdate as BillingInfo;
    }

    // Prepare sub meters data first (compute without DB calls)
    const payPerkWh = calculatePayPerKwh(
      updateData.balance ?? billingInfoWithSubMetersToUpdate.balance,
      updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh
    );
    // Only compute the rich subMetersData if there are changes to process
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
          // new sub meter - persist initial reading as baseline (reading) but do NOT bill it
          if (sub.reading < 0) {
            throw error(400, `Invalid reading for sub meter "${sub.label}"`);
          }
          const subkWh = 0; // starting sub meter => 0 usage
          const paymentAmount = 0;
          return {
            label: sub.label,
            reading: sub.reading,
            subkWh,
            paymentAmount,
          };
        }
      }) ?? [];

    // Validate that total sub-meter kWh does not exceed total billing kWh (prevents negative main usage)
    const totalSubkWh = subMetersData.reduce((sum, s) => sum + s.subkWh, 0);
    const totalkWhForCheck = updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh ?? 0;
    if (totalSubkWh > totalkWhForCheck) {
      throw error(
        400,
        "Invalid meter readings, sub-meter kWh exceeds total kWh (main usage negative)"
      );
    }

    // Perform all DB operations in a transaction
    const result = await db().transaction(async (tx) => {
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

      // Handle sub meters update if provided and only if changes detected
      if (subMeters && subMetersHaveChanges) {
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

      const totalSubPayment = subMetersHaveChanges
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
    getExtendedBillingInfos({ userId: session.userId }).refresh();
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
