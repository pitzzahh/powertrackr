import { query, form, command } from "$app/server";
import * as v from "valibot";
import {
  billFormSchema,
  updateBillingInfoSchema,
  getBillingInfosSchema,
  getBillingInfoSchema,
  deleteBillingInfoSchema,
  deleteBillingInfoSchemaBatch,
  finalizeBillingSchema,
} from "$/validators/billing-info";
import type {
  BillingInfo,
  BillingInfoWithPaymentAndSubMetersWithPayment,
  BillingSummary,
  NewBillingInfo,
} from "$/types/billing-info";
import { requireAuth } from "$/server/auth";
import {
  getBillingInfoBy as getBillingInfoByCrud,
  deleteBillingInfoBy,
  createBillingInfoLogic,
  updateBillingInfoLogic,
  finalizeBillingInfoLogic,
  getTotalEnergyUsageLogic,
  getTotalBillingInfoCountLogic,
} from "$/server/crud/billing-info-crud";
import { invalid, error } from "@sveltejs/kit";
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

// Query to get total energy usage (summed totalKwh) for a user, formatted
// Public endpoint with origin check - only allows requests from same origin
export const getTotalEnergyUsage = query(getTotalEnergyUsageLogic);

// Query to get total billing info count
// Public endpoint with origin check - only allows requests from same origin
export const getTotalBillingInfoCount = query(() => {
  return getTotalBillingInfoCountLogic();
});

// Query to get all billing infos for the authenticated user
export const getBillingInfoBy = query(v.object({}), async (): Promise<HelperResult<unknown>> => {
  const { user, session } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
  return await getBillingInfoByCrud({
    query: { userId: session.userId },
    options: {
      fields: COMMON_FIELDS,
    },
  });
});

export const getLatestBillingInfo = query(
  v.object({}),
  async (): Promise<HelperResult<unknown>> => {
    const { user, session } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
    return await getBillingInfoByCrud({
      query: { userId: session.userId },
      options: {
        fields: COMMON_FIELDS,
        with_sub_meters: true,
        order: "desc",
        limit: 1,
      },
    });
  }
);

// Query to get extended billing infos with payments for the authenticated user
export const getExtendedBillingInfos = query(
  v.object({}),
  async (): Promise<HelperResult<unknown>> => {
    const { user, session } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
    return await getBillingInfoByCrud({
      query: { userId: session.userId },
      options: {
        fields: COMMON_FIELDS,
        with_payment: true,
        with_sub_meters_with_payment: true,
        order: "desc",
      },
    });
  }
);

// Query to get a single billing info by id
export const getBillingInfo = query(getBillingInfoSchema, async (id) => {
  return await getBillingInfoByCrud({
    query: { id },
    options: {
      fields: COMMON_FIELDS,
    },
  });
});

// Query to get billing summary for the authenticated user
export const getBillingSummary = query(getBillingInfosSchema, async (): Promise<BillingSummary> => {
  const result = await getExtendedBillingInfos({});
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
  if (!latest) {
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
  const current = latest.balance ?? 0;
  const invested = extendedInfos.reduce(
    (sum, info) =>
      sum +
      ((info.payment?.amount ?? 0) +
        (info.subMeters ?? []).reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0)),
    0
  );
  const totalReturns = extendedInfos.reduce(
    (sum: number, info) =>
      sum + (info.subMeters ?? []).reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0),
    0
  );
  const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
  const oneDayReturns =
    latest.subMeters?.reduce((sum, sub) => sum + (sub.payment?.amount ?? 0), 0) ?? 0;

  const firstDate = extendedInfos[extendedInfos.length - 1].date;
  const lastDate = latest.date;
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageDailyReturn = totalReturns / totalDays;
  const totalMonths = totalDays / 30;
  const averageMonthlyReturn = totalReturns / totalMonths;

  // period change (previous_totalPayment - latest_totalPayment)
  const totalPayment = (info: BillingInfoWithPaymentAndSubMetersWithPayment) =>
    (info.payment?.amount ?? 0) +
    (info.subMeters ?? []).reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0);
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
});

// Single-flight refresh of every query that reads billing, meter, or stats
// data, so one mutation invalidates all cached copies in a single round-trip.
// Lives in a plain module because `.remote.ts` files may only export remote
// functions.
import { refreshBillingData } from "./billing-refresh";

// Form to create a new billing info with multiple sub meters
export const createBillingInfo = form(
  billFormSchema,
  async (data, issues): Promise<BillingInfo> => {
    const { user, session } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
    const userId = session.userId;

    try {
      const result = await createBillingInfoLogic(data, userId);
      refreshBillingData();
      return result;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Invalid meter readings")) {
        invalid(issues.subMeters(err.message));
      }
      throw err;
    }
  }
);

// Form to update an existing billing info with multiple sub meters
export const updateBillingInfo = form(
  updateBillingInfoSchema,
  async (data): Promise<BillingInfo> => {
    const { user, session } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
    const userId = session.userId;

    const result = await updateBillingInfoLogic(data, userId);
    refreshBillingData();
    return result;
  }
);

// Command to delete a billing info
export const deleteBillingInfo = command(deleteBillingInfoSchema, async ({ id }) => {
  const { user } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

  const result = await deleteBillingInfoBy({ query: { id } });

  if (result.value === 1) {
    refreshBillingData();
  }

  return result;
});

export const deleteBillingInfoBatch = command(
  deleteBillingInfoSchemaBatch,
  async ({ ids, count }) => {
    const { user } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

    const validCount = (
      await Promise.all(ids.map((id) => deleteBillingInfoBy({ query: { id } })))
    ).filter((result) => result.valid).length;

    if (validCount === count) {
      refreshBillingData();
    }

    return {
      valid: validCount === count,
      value: validCount,
      message: `${validCount} item(s) deleted successfully`,
    } as HelperResult<number>;
  }
);

// Command to finalize a pending billing once tenants have submitted readings
export const finalizeBilling = command(finalizeBillingSchema, async ({ billingInfoId }) => {
  const { user, session } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

  const result = await finalizeBillingInfoLogic(billingInfoId, session.userId);
  refreshBillingData();
  return result;
});
