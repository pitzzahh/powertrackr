import { query, form, command } from "$app/server";
import { EMPTY_SCHEMA } from "#lib/validators/shared.js";
import {
  BILL_FORM_SCHEMA,
  UPDATE_BILLING_INFO_SCHEMA,
  DELETE_BILLING_INFO_SCHEMA,
  DELETE_BILLING_INFO_BATCH_SCHEMA,
  FINALIZE_BILLING_SCHEMA,
} from "#lib/validators/billing-info.js";
import type { BillingInfo, NewBillingInfo } from "#lib/types/billing-info.js";
import { requireAuth } from "#lib/server/auth.js";
import {
  getBillingInfoBy as getBillingInfoByCrud,
  deleteBillingInfoBy,
} from "#lib/server/crud/billing-info-crud.js";
import {
  createBillingInfoLogic,
  updateBillingInfoLogic,
  finalizeBillingInfoLogic,
  assertBillingsDeletable,
} from "#lib/server/crud/billing-logic.js";
import { invalid, error } from "@sveltejs/kit";
import type { HelperResult } from "#lib/types/helper.js";

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

// Query to get all billing infos for the authenticated user
export const getBillingInfoBy = query(EMPTY_SCHEMA, async (): Promise<HelperResult<unknown>> => {
  const { user, session } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");
  return await getBillingInfoByCrud({
    query: { userId: session.userId },
    options: {
      fields: COMMON_FIELDS,
    },
  });
});

export const getLatestBillingInfo = query(EMPTY_SCHEMA, async () => {
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
});

// Query to get extended billing infos with payments for the authenticated user
export const getExtendedBillingInfos = query(
  EMPTY_SCHEMA,
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

// Single-flight refresh of every query that reads billing, meter, or stats
// data, so one mutation invalidates all cached copies in a single round-trip.
// Lives in a plain module because `.remote.ts` files may only export remote
// functions.
import { refreshBillingData } from "./billing-refresh";

// Form to create a new billing info with multiple sub meters
export const createBillingInfo = form(
  BILL_FORM_SCHEMA,
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
  UPDATE_BILLING_INFO_SCHEMA,
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
export const deleteBillingInfo = command(DELETE_BILLING_INFO_SCHEMA, async ({ id }) => {
  const { user } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

  await assertBillingsDeletable(user.id, [id]);
  // userId scopes the delete to the caller's own billings.
  const result = await deleteBillingInfoBy({ query: { id, userId: user.id } });

  if (result.value === 1) {
    refreshBillingData();
  }

  return result;
});

export const deleteBillingInfoBatch = command(
  DELETE_BILLING_INFO_BATCH_SCHEMA,
  async ({ ids, count }) => {
    const { user } = requireAuth();
    if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

    await assertBillingsDeletable(user.id, ids);
    const validCount = (
      await Promise.all(ids.map((id) => deleteBillingInfoBy({ query: { id, userId: user.id } })))
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
export const finalizeBilling = command(FINALIZE_BILLING_SCHEMA, async ({ billingInfoId }) => {
  const { user, session } = requireAuth();
  if (user.ownerId) error(403, "Tenant accounts cannot access billing data");

  const result = await finalizeBillingInfoLogic(billingInfoId, session.userId);
  refreshBillingData();
  return result;
});
