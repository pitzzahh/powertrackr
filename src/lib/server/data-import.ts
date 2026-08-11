import { db } from "$/server/db";
import { createBillingInfoLogic } from "$/server/crud/billing-info-crud";
import type { BillingInfo, BillingSubMeterForm } from "$/types/billing-info";

/**
 * A billing item as accepted by imports: sub-meters are identified by label
 * (the tenant's name), which is resolved against the owner's tenants.
 */
export type ImportBillingItem = {
  date: string;
  totalkWh: number;
  balance: number;
  status: string;
  subMeters: { label: string; reading: number; status?: string }[];
};

export type ImportBillingResult = {
  created: BillingInfo[];
  /** Sub-meter labels that matched no tenant and were skipped. */
  skipped: { label: string }[];
};

/**
 * Handler that imports an array of billing form items for a user.
 * - Sub-meters ARE tenants: each `label` is matched to a tenant account by
 *   name; labels matching no tenant are skipped and reported.
 * - Reuses `createBillingInfoLogic` to ensure consistent behavior.
 */
export async function importBillingHandler(
  items: ImportBillingItem[],
  userId: string
): Promise<ImportBillingResult> {
  const created: BillingInfo[] = [];
  const skipped: { label: string }[] = [];

  // Process billing items chronologically (oldest first). If items are
  // supplied out-of-order (e.g. newest first) sub-meter usage calculations
  // can become negative because a newer reading would be inserted before
  // an older one. Sorting here ensures proper baseline readings are present.
  const sortedItems = [...items].sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    const na = Number.isFinite(ta) ? ta : 0;
    const nb = Number.isFinite(tb) ? tb : 0;
    return na - nb;
  });

  // Tenants ARE sub-meters: match each imported label to a tenant by name.
  const tenants = await db().query.user.findMany({ where: { ownerId: userId } });
  const tenantByName = new Map(tenants.map((t) => [t.name, t]));

  for (const item of sortedItems) {
    const subMeters: BillingSubMeterForm[] = [];
    for (const sub of item.subMeters ?? []) {
      const tenant = tenantByName.get(sub.label);
      if (!tenant) {
        skipped.push({ label: sub.label });
        continue;
      }
      subMeters.push({
        tenantUserId: tenant.id,
        reading: sub.reading,
        status: (sub.status ?? "pending") as BillingSubMeterForm["status"],
      });
    }
    const ci = await createBillingInfoLogic(
      {
        date: item.date,
        totalkWh: item.totalkWh,
        balance: item.balance,
        status: item.status,
        subMeters,
      },
      userId
    );
    created.push(ci);
  }

  return { created, skipped };
}
