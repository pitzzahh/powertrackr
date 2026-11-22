import { db } from "#lib/server/db/index.js";
import { and, desc, eq, isNotNull, lt } from "drizzle-orm";
import { billingInfo, tenantReading } from "#lib/server/db/schema/index.js";
import { error } from "@sveltejs/kit";

// Per-tenant usage: deltas against the last billed reading.

/*
 * computeTenantUsages
 *
 * Computes per-tenant usage for a set of sub-meters (tenants). A tenant's
 * usage is its reading delta against its most recent billed reading; a tenant
 * with no previous reading carries 0 usage (baseline).
 */
export function computeTenantUsages(
  entries: {
    tenant: { id: string; name: string };
    reading: number;
    prevReading: number | null;
  }[],
  payPerkWh: number
): Map<string, { usage: number; payment: number }> {
  const usages = new Map<string, { usage: number; payment: number }>();
  for (const entry of entries) {
    const rawDelta = entry.prevReading === null ? 0 : entry.reading - entry.prevReading;
    if (rawDelta < 0) {
      throw error(400, `Invalid reading for sub meter "${entry.tenant.name}"`);
    }
    const payment = Number((rawDelta * payPerkWh).toFixed(2));
    usages.set(entry.tenant.id, { usage: rawDelta, payment });
  }
  return usages;
}

/**
 * The tenant's most recent billed reading, optionally restricted to records
 * strictly before `beforeDate`. This is the baseline for usage computation.
 * Unlike the immediately-previous record, this searches back to the most
 * recent record that actually contains the tenant, so a tenant omitted from
 * the latest record keeps its true baseline.
 */
export async function getLastTenantReading(
  userId: string,
  tenantUserId: string,
  beforeDate?: Date
): Promise<number | null> {
  const [row] = await db()
    .select({ reading: tenantReading.reading })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(
      and(
        eq(billingInfo.userId, userId),
        eq(tenantReading.tenantUserId, tenantUserId),
        // Pending rows (tenant has not submitted yet) are not baselines
        isNotNull(tenantReading.reading),
        beforeDate ? lt(billingInfo.date, beforeDate) : undefined
      )
    )
    .orderBy(desc(billingInfo.date))
    .limit(1);
  return row?.reading ?? null;
}
