import type { ImportBillingResult } from "#lib/types/import.js";
import { isHttpError } from "@sveltejs/kit";
import { db } from "#lib/server/db/index.js";
import { createBillingInfoLogic } from "#lib/server/crud/billing-logic.js";
import type { BillingInfo } from "#lib/types/billing-info.js";
import type { BillingSubMeterForm } from "#lib/types/billing-info.js";
import type { ImportBillingItem } from "#lib/types/import.js";
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
        status: sub.status,
      });
    }
    // Each item is its own D1 batch (it needs the previous item's readings as
    // its baseline), so the import is not all-or-nothing: say what was saved.
    try {
      created.push(
        await createBillingInfoLogic(
          {
            date: item.date,
            totalkWh: item.totalkWh,
            balance: item.balance,
            status: item.status,
            subMeters,
          },
          userId
        )
      );
    } catch (err) {
      const reason = isHttpError(err)
        ? err.body.message
        : err instanceof Error
          ? err.message
          : String(err);
      throw new Error(
        `Billing dated ${item.date} failed: ${reason}. ${created.length} earlier billing(s) were already saved; remove them from the file before importing again.`,
        { cause: err }
      );
    }
  }

  return { created, skipped };
}
