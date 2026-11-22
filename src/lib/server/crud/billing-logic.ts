import { db, asNonEmptyBatch } from "#lib/server/db/index.js";
import type { BatchQuery } from "#lib/types/db.js";
import { and, between, eq, gt, inArray, isNotNull, isNull, ne, notInArray, sql } from "drizzle-orm";
import { billingInfo, payment, tenantReading } from "#lib/server/db/schema/index.js";
import { getChangedData, omit } from "#lib/utils/mapper.js";
import type { BillingInfo } from "#lib/types/billing-info.js";
import type {
  BillingCreateForm,
  BillingSubMeterForm,
  BillingUpdateForm,
} from "#lib/types/billing-info.js";
import type { TenantReadingDTO } from "#lib/types/billing-info.js";
import type { User } from "#lib/types/user.js";
import { calculatePayPerKwh } from "#lib";
import { error } from "@sveltejs/kit";
import { computeTenantUsages, getLastTenantReading } from "./billing-usage.js";
import { getBillingInfoBy } from "./billing-info-crud.js";

// Billing workflows: create, edit and finalize a bill as single D1 batches.

type ResolvedTenant = {
  entry: BillingSubMeterForm;
  tenant: User;
};

/*
 * resolveTenants
 *
 * Resolves the form's tenant references to tenant accounts belonging to the
 * owner. Sub-meters ARE tenants: the entry's tenantUserId is the sub-meter id.
 */
async function resolveTenants(
  userId: string,
  subMeters: BillingSubMeterForm[]
): Promise<ResolvedTenant[]> {
  const resolved: ResolvedTenant[] = [];
  const seen = new Set<string>();
  for (const entry of subMeters) {
    const tenant = await db().query.user.findFirst({ where: { id: entry.tenantUserId } });
    if (!tenant || tenant.ownerId !== userId) {
      throw error(400, "Unknown sub meter tenant");
    }
    if (seen.has(tenant.id)) {
      throw error(400, "Duplicate sub meter");
    }
    seen.add(tenant.id);
    resolved.push({ entry, tenant });
  }
  return resolved;
}

/*
 * createBillingInfoLogic
 *
 * - Recreates the logic previously in the billing-info remote layer.
 * - Uses a single D1 batch to persist payments, billing info, and tenant readings.
 */
export async function createBillingInfoLogic(
  data: BillingCreateForm,
  userId: string
): Promise<BillingInfo> {
  const { date, totalkWh, balance, status, subMeters } = data;
  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  const user = await db().query.user.findFirst({ where: { id: userId } });
  if (user?.ownerId) {
    throw error(403, "Tenant accounts cannot create billing records");
  }

  const resolved = await resolveTenants(userId, subMeters);

  // No sub meters means nothing to wait for: the bill is complete now (every()
  // is true on an empty list, which used to save it without a main payment).
  const allPending = resolved.length > 0 && resolved.every(({ entry }) => entry.reading == null);
  const anyPending = resolved.some(({ entry }) => entry.reading == null);
  if (anyPending && !allPending) {
    throw error(
      400,
      "Either provide readings for every sub meter, or none to create a pending billing"
    );
  }

  // Pending billing: create the record with tenant rows waiting for readings.
  // Tenants submit readings for this billing, then `finalizeBillingInfoLogic`
  // materializes the usage and payments.
  if (allPending) {
    const database = db();
    const billingInfoId = crypto.randomUUID();

    const batchQueries: BatchQuery[] = [
      database
        .insert(billingInfo)
        .values({
          id: billingInfoId,
          userId,
          date: new Date(date),
          totalkWh,
          balance,
          status,
          payPerkWh,
        })
        .returning(),
    ];

    for (const { entry, tenant } of resolved) {
      batchQueries.push(
        database.insert(tenantReading).values({
          id: crypto.randomUUID(),
          tenantUserId: tenant.id,
          billingInfoId,
          status: entry.status ?? "pending",
        })
      );
    }

    const batchPayload = asNonEmptyBatch(batchQueries);
    if (!batchPayload) {
      throw error(400, "Failed to add billing info, no batch queries were generated");
    }
    const batchResults = await database.batch(batchPayload);
    const createdBillingInfo = Array.isArray(batchResults[0]) ? batchResults[0][0] : undefined;

    if (!createdBillingInfo) {
      throw error(400, "Failed to add billing info, billing info not processed");
    }

    return createdBillingInfo;
  }

  const usages = computeTenantUsages(
    await Promise.all(
      resolved.map(async ({ entry, tenant }) => {
        if (entry.reading == null) {
          throw error(400, "Provide a reading for every sub meter");
        }
        return {
          tenant,
          reading: entry.reading,
          prevReading: await getLastTenantReading(userId, tenant.id),
        };
      })
    ),
    payPerkWh
  );

  const totalSubPayment = [...usages.values()].reduce((sum, u) => sum + u.payment, 0);
  const totalSubkWh = [...usages.values()].reduce((sum, u) => sum + u.usage, 0);

  const mainUsage = totalkWh - totalSubkWh;
  const mainPaymentAmount = Number((balance - totalSubPayment).toFixed(2));
  if (mainPaymentAmount < 0) {
    throw error(400, "Main payment amount cannot be negative");
  }

  if (mainUsage < 0) {
    throw error(400, "Invalid meter readings, computed kWh usage does not meet total kWh usage");
  }

  const database = db();
  const mainPaymentId = crypto.randomUUID();
  const billingInfoId = crypto.randomUUID();

  const batchQueries: BatchQuery[] = [];

  batchQueries.push(
    database.insert(payment).values({
      id: mainPaymentId,
      amount: mainPaymentAmount,
      date: new Date(),
    })
  );

  const billingInfoResultIndex = batchQueries.length;
  batchQueries.push(
    database
      .insert(billingInfo)
      .values({
        id: billingInfoId,
        userId,
        date: new Date(date),
        totalkWh,
        balance,
        status,
        payPerkWh,
        paymentId: mainPaymentId,
      })
      .returning()
  );

  for (const { entry, tenant } of resolved) {
    const { usage, payment: paymentAmount } = usages.get(tenant.id)!;

    const subPaymentId = crypto.randomUUID();

    batchQueries.push(
      database.insert(payment).values({
        id: subPaymentId,
        amount: paymentAmount,
      })
    );

    batchQueries.push(
      database.insert(tenantReading).values({
        id: crypto.randomUUID(),
        tenantUserId: tenant.id,
        billingInfoId,
        reading: entry.reading,
        subkWh: usage,
        paymentId: subPaymentId,
        status: entry.status,
      })
    );
  }

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to add billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const createdBillingInfo = Array.isArray(batchResults[billingInfoResultIndex])
    ? batchResults[billingInfoResultIndex][0]
    : undefined;

  if (!createdBillingInfo) {
    throw error(400, "Failed to add billing info, billing info not processed");
  }

  return createdBillingInfo;
}

/*
 * updateBillingInfoLogic
 *
 * - Recreates the logic previously in the billing-info remote layer.
 * - Recomputes sub-meter usage against the PREVIOUS billed reading for each
 *   tenant (the most recent record strictly before this one that contains
 *   them), not the record's own stored readings, so editing a record keeps
 *   the cumulative progression consistent.
 * - Persists the recomputed `payPerkWh` on the billing info record.
 * - Removes tenant readings together with their linked payment rows so no
 *   orphaned payments are left behind.
 * - Uses a single D1 batch to persist all changes.
 */
export async function updateBillingInfoLogic(
  data: BillingUpdateForm,
  userId: string
): Promise<BillingInfo> {
  const { id: billingInfoId, subMeters, ...updateData } = data;

  const {
    valid: validBillingInfo,
    value: [billingInfoWithSubMetersToUpdate],
  } = await getBillingInfoBy({
    query: { userId, id: billingInfoId },
    options: {
      fields: ["id", "date", "status", "balance", "totalkWh", "paymentId"],
      with_payment: true,
      with_sub_meters_with_payment: true,
    },
  });

  if (!validBillingInfo) {
    throw error(400, "Failed to update billing info");
  }

  const user = await db().query.user.findFirst({ where: { id: userId } });
  if (user?.ownerId) {
    throw error(403, "Tenant accounts cannot create billing records");
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

  // Determine whether provided subMeters actually differ from existing ones
  // (cheap checks) so we can skip heavy work when they don't.
  const existingSubMeters = billingInfoWithSubMetersToUpdate.subMeters ?? [];
  let subMetersHaveChanges = false;
  if (subMeters !== undefined && subMeters !== null) {
    if ((subMeters.length ?? 0) !== (existingSubMeters.length ?? 0)) {
      subMetersHaveChanges = true;
    }
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
        if (
          existing.tenantUserId !== s.tenantUserId ||
          existing.reading !== s.reading ||
          existing.status !== s.status
        ) {
          subMetersHaveChanges = true;
          break;
        }
      }
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
    return billingInfoWithSubMetersToUpdate as BillingInfo;
  }

  const database = db();

  const recordDate = billingInfoWithSubMetersToUpdate.date;
  if (!recordDate) {
    throw error(400, "Failed to update billing info, missing record date");
  }

  const payPerkWh = calculatePayPerKwh(
    updateData.balance ?? billingInfoWithSubMetersToUpdate.balance,
    updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh
  );

  const resolved = subMeters ? await resolveTenants(userId, subMeters) : [];

  // Moving the date past another billing of the same tenant would reorder the
  // reading chain (baselines of both bills), so refuse that. With no billing in
  // between, the baselines before the earlier of the two dates stay the same.
  const newDate = updatedData.date;
  const [fromDate, toDate] = newDate < recordDate ? [newDate, recordDate] : [recordDate, newDate];
  const chainTenantIds = [
    ...new Set([
      ...existingSubMeters.map((m) => m.tenantUserId),
      ...resolved.map(({ tenant }) => tenant.id),
    ]),
  ];
  if (newDate.getTime() !== recordDate.getTime() && chainTenantIds.length > 0) {
    const [crossed] = await database
      .select({ id: billingInfo.id })
      .from(tenantReading)
      .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
      .where(
        and(
          eq(billingInfo.userId, userId),
          ne(billingInfo.id, billingInfoId),
          between(billingInfo.date, fromDate, toDate),
          inArray(tenantReading.tenantUserId, chainTenantIds),
          isNotNull(tenantReading.reading)
        )
      )
      .limit(1);
    if (crossed) {
      throw error(
        400,
        "Another billing for the same tenant falls between the old and new date. Delete or edit that billing first."
      );
    }
  }

  const usageByTenant = new Map<string, { usage: number; payment: number }>();
  if (resolved.length > 0) {
    const usages = computeTenantUsages(
      await Promise.all(
        resolved.map(async ({ entry, tenant }) => {
          if (entry.reading == null) {
            throw error(400, "Provide a reading for every sub meter");
          }
          return {
            tenant,
            reading: entry.reading,
            prevReading: await getLastTenantReading(userId, tenant.id, fromDate),
          };
        })
      ),
      payPerkWh
    );
    for (const [id, value] of usages) {
      usageByTenant.set(id, value);
    }
  }

  type PreparedSubMeter = {
    id?: string;
    tenantUserId: string;
    tenantName: string;
    reading: number;
    subkWh: number;
    status: string;
    paymentAmount: number;
    paymentId?: string | null;
  };
  const subMetersData: PreparedSubMeter[] = resolved.map(({ entry, tenant }) => {
    if (entry.reading == null) {
      throw error(400, "Provide a reading for every sub meter");
    }
    const { usage, payment: paymentAmount } = usageByTenant.get(tenant.id)!;

    const existing = entry.id ? existingSubMeters.find((m) => m.id === entry.id) : undefined;
    if (entry.id && !existing) {
      throw error(400, `Sub meter with id "${entry.id}" not found`);
    }
    return {
      id: entry.id,
      tenantUserId: tenant.id,
      tenantName: tenant.name,
      reading: entry.reading,
      subkWh: usage,
      status: entry.status ?? existing?.status ?? "pending",
      paymentAmount,
      paymentId: existing?.paymentId,
    };
  });

  // A later billing used this record's reading as its baseline. Changing,
  // adding or removing it here would leave that later bill computed against a
  // stale baseline, so refuse instead of silently mis-billing the tenant.
  const touchedTenantIds = new Set<string>();
  for (const sub of subMetersData) {
    const existing = existingSubMeters.find((m) => m.tenantUserId === sub.tenantUserId);
    if (!existing || existing.reading !== sub.reading) touchedTenantIds.add(sub.tenantUserId);
  }
  for (const existing of existingSubMeters) {
    if (!subMetersData.some((sub) => sub.tenantUserId === existing.tenantUserId)) {
      touchedTenantIds.add(existing.tenantUserId);
    }
  }
  if (subMetersHaveChanges && touchedTenantIds.size > 0) {
    const [later] = await database
      .select({ tenantUserId: tenantReading.tenantUserId })
      .from(tenantReading)
      .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
      .where(
        and(
          eq(billingInfo.userId, userId),
          gt(billingInfo.date, recordDate),
          inArray(tenantReading.tenantUserId, [...touchedTenantIds]),
          isNotNull(tenantReading.reading)
        )
      )
      .limit(1);
    if (later) {
      throw error(
        400,
        "A later billing already uses this reading. Edit the latest billing first, or delete the later ones."
      );
    }
  }

  // Validate that total sub-meter kWh does not exceed total billing kWh (prevents negative main usage)
  const totalSubkWh = subMetersData.reduce((sum, s) => sum + s.subkWh, 0);
  const totalkWhForCheck = updateData.totalkWh ?? billingInfoWithSubMetersToUpdate.totalkWh ?? 0;
  if (totalSubkWh > totalkWhForCheck) {
    throw error(
      400,
      "Invalid meter readings, sub-meter kWh exceeds total kWh (main usage negative)"
    );
  }

  // Perform all DB operations in a single D1 batch
  const batchQueries: BatchQuery[] = [];
  let billingInfoResultIndex: number | null = null;

  if (Object.keys(changed_data).length > 0) {
    billingInfoResultIndex = batchQueries.length;
    batchQueries.push(
      database
        .update(billingInfo)
        .set({
          ...changed_data,
          // Keep the stored rate in sync with the values used for payment math.
          payPerkWh,
        })
        .where(eq(billingInfo.id, billingInfoId))
        .returning()
    );
  }

  // Handle sub meters update if provided and only if changes detected
  if (subMeters && subMetersHaveChanges) {
    const existingIds = billingInfoWithSubMetersToUpdate.subMeters?.map((s) => s.id) || [];
    const providedIds = subMetersData.filter((s) => s.id !== undefined).map((s) => s.id!);
    const toDeleteIds = existingIds.filter((id) => !providedIds.includes(id));

    if (toDeleteIds.length > 0) {
      const toDeleteSubMeters = existingSubMeters.filter((s) => toDeleteIds.includes(s.id));
      const toDeletePaymentIds = toDeleteSubMeters
        .map((s) => s.paymentId)
        .filter((id): id is string => !!id);

      batchQueries.push(
        database.delete(tenantReading).where(inArray(tenantReading.id, toDeleteIds))
      );
      // Remove linked payments too so no orphaned rows accumulate.
      if (toDeletePaymentIds.length > 0) {
        batchQueries.push(database.delete(payment).where(inArray(payment.id, toDeletePaymentIds)));
      }
    }

    for (const subData of subMetersData) {
      if (subData.id) {
        const existing = existingSubMeters.find((m) => m.id === subData.id);
        if (existing?.paymentId) {
          // Already materialized (tenant submitted or a previous edit) — update
          // the reading and its linked payment.
          batchQueries.push(
            database
              .update(tenantReading)
              .set({
                reading: subData.reading,
                subkWh: subData.subkWh,
                status: subData.status,
              })
              .where(eq(tenantReading.id, subData.id))
          );

          batchQueries.push(
            database
              .update(payment)
              .set({ amount: subData.paymentAmount })
              .where(eq(payment.id, existing.paymentId))
          );
        } else {
          // Pending row (tenant has not submitted yet) — the owner is setting
          // the reading, so materialize the usage and payment now.
          const newPaymentId = crypto.randomUUID();

          batchQueries.push(
            database.insert(payment).values({
              id: newPaymentId,
              date: new Date(),
              amount: subData.paymentAmount,
            })
          );

          batchQueries.push(
            database
              .update(tenantReading)
              .set({
                reading: subData.reading,
                subkWh: subData.subkWh,
                paymentId: newPaymentId,
                status: subData.status,
              })
              .where(eq(tenantReading.id, subData.id))
          );
        }
      } else {
        // add new
        const newPaymentId = crypto.randomUUID();

        batchQueries.push(
          database.insert(payment).values({
            id: newPaymentId,
            date: new Date(),
            amount: subData.paymentAmount,
          })
        );

        batchQueries.push(
          database.insert(tenantReading).values({
            id: crypto.randomUUID(),
            tenantUserId: subData.tenantUserId,
            billingInfoId,
            reading: subData.reading,
            subkWh: subData.subkWh,
            paymentId: newPaymentId,
            status: subData.status,
          })
        );
      }
    }
  }

  const existingMainPaymentId = billingInfoWithSubMetersToUpdate.paymentId;

  const totalSubPayment = subMetersHaveChanges
    ? subMetersData.reduce((sum, sub) => sum + sub.paymentAmount, 0)
    : (billingInfoWithSubMetersToUpdate.subMeters || []).reduce(
        (sum, sub) => sum + (sub.payment?.amount ?? 0),
        0
      );

  // Pending (unfinalized) billings have no main payment yet — leave it null
  // and auto-finalize below once every tenant reading is in.
  if (existingMainPaymentId) {
    const updatedBalance = updateData.balance ?? billingInfoWithSubMetersToUpdate.balance ?? 0;
    const mainPaymentAmount = updatedBalance - totalSubPayment;
    if (mainPaymentAmount < 0) {
      throw error(400, "Main payment amount cannot be negative");
    }

    batchQueries.push(
      database
        .update(payment)
        .set({
          amount: mainPaymentAmount,
        })
        .where(eq(payment.id, existingMainPaymentId))
    );
  }

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to update billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const updatedBillingInfo =
    billingInfoResultIndex !== null
      ? Array.isArray(batchResults[billingInfoResultIndex])
        ? batchResults[billingInfoResultIndex][0]
        : undefined
      : (billingInfoWithSubMetersToUpdate as BillingInfo);

  if (billingInfoResultIndex !== null && !updatedBillingInfo) {
    throw error(400, "Failed to update billing info");
  }

  // A pending billing with all readings now filled (owner set them, or tenants
  // submitted earlier) is complete — materialize the main payment + mark paid.
  if (!existingMainPaymentId && subMeters && subMeters.length > 0) {
    return finalizeBillingInfoLogic(billingInfoId, userId);
  }

  return updatedBillingInfo;
}

/**
 * finalizeBillingInfoLogic
 *
 * Materializes a pending billing: for each tenant row with a submitted
 * reading, computes usage against the tenant's most recent billed reading
 * (strictly before this record), creates the sub payments and the main
 * payment, and marks the rows and record as paid. Tenants that have not
 * submitted yet are left pending.
 */
export async function finalizeBillingInfoLogic(
  billingInfoId: string,
  userId: string
): Promise<BillingInfo> {
  const {
    valid,
    value: [billing],
  } = await getBillingInfoBy({
    query: { userId, id: billingInfoId },
    options: {
      fields: ["id", "date", "balance", "totalkWh", "status", "payPerkWh", "paymentId"],
      with_sub_meters_with_payment: true,
    },
  });

  if (!valid) {
    throw error(400, "Failed to finalize billing info");
  }
  if (billing.paymentId) {
    throw error(400, "Billing info is already finalized");
  }

  const recordDate = billing.date;
  if (!recordDate) {
    throw error(400, "Failed to finalize billing info, missing record date");
  }

  const balance = billing.balance;
  const totalkWh = billing.totalkWh;
  if (balance == null || totalkWh == null) {
    throw error(400, "Failed to finalize billing info, missing balance or total kWh");
  }

  const payPerkWh = calculatePayPerKwh(balance, totalkWh);

  const allRows = billing.subMeters ?? [];

  // Rows already materialized at submission carry their own payment; only
  // pending rows (reading set, no payment yet) get payments created here.
  const existingSubPayment = allRows.reduce((sum, s) => sum + (s.payment?.amount ?? 0), 0);
  const rows = allRows.filter(
    (s): s is TenantReadingDTO & { reading: number } => s.reading != null && s.paymentId == null
  );
  if (rows.length === 0 && existingSubPayment === 0) {
    throw error(400, "No tenant readings to finalize");
  }

  const usages = computeTenantUsages(
    await Promise.all(
      rows.map(async (s) => ({
        tenant: { id: s.tenantUserId, name: s.tenantName },
        reading: s.reading,
        prevReading: await getLastTenantReading(userId, s.tenantUserId, recordDate),
      }))
    ),
    payPerkWh
  );

  const newSubPayment = [...usages.values()].reduce((sum, u) => sum + u.payment, 0);
  const totalSubPayment = existingSubPayment + newSubPayment;
  const existingSubkWh = allRows.reduce((sum, s) => sum + (s.subkWh ?? 0), 0);
  const totalSubkWh = existingSubkWh + [...usages.values()].reduce((sum, u) => sum + u.usage, 0);

  const mainUsage = totalkWh - totalSubkWh;
  const mainPaymentAmount = Number((balance - totalSubPayment).toFixed(2));
  if (mainPaymentAmount < 0) {
    throw error(400, "Main payment amount cannot be negative");
  }
  if (mainUsage < 0) {
    throw error(400, "Invalid meter readings, computed kWh usage does not meet total kWh usage");
  }

  const database = db();
  const mainPaymentId = crypto.randomUUID();
  const subPaymentIds: string[] = [];
  const rowResultIndexes: number[] = [];
  const batchQueries: BatchQuery[] = [
    database.insert(payment).values({
      id: mainPaymentId,
      amount: mainPaymentAmount,
      date: new Date(),
    }),
  ];

  // Claim the billing first, guarded on "not finalized yet". Two finalizes can
  // race (last tenant's auto-finalize vs. the owner's button); only the one
  // whose claim lands attaches payments, the loser cleans up below.
  const billingResultIndex = batchQueries.length;
  batchQueries.push(
    database
      .update(billingInfo)
      .set({
        paymentId: mainPaymentId,
        payPerkWh,
        status: "paid",
      })
      .where(and(eq(billingInfo.id, billingInfoId), isNull(billingInfo.paymentId)))
      .returning()
  );
  const claimedByUs = sql`exists (select 1 from ${billingInfo} where ${billingInfo.id} = ${billingInfoId} and ${billingInfo.paymentId} = ${mainPaymentId})`;

  for (const s of rows) {
    const { usage, payment: paymentAmount } = usages.get(s.tenantUserId)!;

    const subPaymentId = crypto.randomUUID();
    subPaymentIds.push(subPaymentId);

    batchQueries.push(
      database.insert(payment).values({
        id: subPaymentId,
        amount: paymentAmount,
      })
    );

    batchQueries.push(
      database
        .update(tenantReading)
        .set({
          reading: s.reading,
          subkWh: usage,
          paymentId: subPaymentId,
          status: "paid",
        })
        .where(and(eq(tenantReading.id, s.id), isNull(tenantReading.paymentId), claimedByUs))
        .returning({ id: tenantReading.id })
    );
    rowResultIndexes.push(batchQueries.length - 1);
  }

  const batchPayload = asNonEmptyBatch(batchQueries);
  if (!batchPayload) {
    throw error(400, "Failed to finalize billing info, no batch queries were generated");
  }
  const batchResults = await database.batch(batchPayload);
  const updatedBillingInfo = Array.isArray(batchResults[billingResultIndex])
    ? batchResults[billingResultIndex][0]
    : undefined;

  if (!updatedBillingInfo) {
    // Lost the race: nothing references our payments, so remove them.
    await database.delete(payment).where(inArray(payment.id, [mainPaymentId, ...subPaymentIds]));
    throw error(409, "Billing info is already finalized");
  }

  // A row whose guarded update matched nothing (paid concurrently) leaves its
  // new sub payment unreferenced; remove those.
  const orphanIds = subPaymentIds.filter((_, i) => {
    const res = batchResults[rowResultIndexes[i]];
    return !Array.isArray(res) || res.length === 0;
  });
  if (orphanIds.length > 0) {
    await database.delete(payment).where(inArray(payment.id, orphanIds));
  }

  return updatedBillingInfo;
}

// Deleting a billing whose tenant reading is the baseline of a later billing
// would leave that later bill priced against a reading that no longer exists.
// Billings deleted together may depend on each other, so `billingIds` is the
// whole set being deleted.
export async function assertBillingsDeletable(userId: string, billingIds: string[]) {
  const database = db();
  const readings = await database
    .select({ date: billingInfo.date, tenantUserId: tenantReading.tenantUserId })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(
      and(
        eq(billingInfo.userId, userId),
        inArray(billingInfo.id, billingIds),
        isNotNull(tenantReading.reading)
      )
    );
  for (const { date, tenantUserId } of readings) {
    const [later] = await database
      .select({ id: billingInfo.id })
      .from(tenantReading)
      .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
      .where(
        and(
          eq(billingInfo.userId, userId),
          gt(billingInfo.date, date),
          notInArray(billingInfo.id, billingIds),
          eq(tenantReading.tenantUserId, tenantUserId),
          isNotNull(tenantReading.reading)
        )
      )
      .limit(1);
    if (later) {
      throw error(
        400,
        "A later billing already uses this billing's readings. Delete the later billings first."
      );
    }
  }
}
