export type TenantReadingLike = {
  id?: string;
  tenantUserId?: string;
  reading?: number | null;
};

export type BillingInfoLike = {
  date: Date | string;
  subMeters?: TenantReadingLike[];
};

/**
 * Finds the billing record immediately before `currentDate` (strictly earlier,
 * greatest date) in `infos`. Returns `undefined` when no earlier record exists.
 */
export function findPreviousBillingInfo<T extends BillingInfoLike>(
  infos: T[],
  currentDate: Date | string
): T | undefined {
  const currentTime = new Date(currentDate).getTime();
  let previous: T | undefined;
  for (const info of infos) {
    const time = new Date(info.date).getTime();
    if (time < currentTime && (!previous || time > new Date(previous.date).getTime())) {
      previous = info;
    }
  }
  return previous;
}

/**
 * Resolves the previous period's reading for each tenant (matched by
 * tenantUserId), keyed by entry id. Tenants with no matching tenantUserId in
 * the previous period (or without an id) resolve to 0 (baseline).
 */
export function resolvePreviousReadings(
  entries: TenantReadingLike[],
  previousMeters: TenantReadingLike[]
): Map<string, number> {
  const readings = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.id) continue;
    const previous = previousMeters.find((p) => p.tenantUserId === entry.tenantUserId);
    readings.set(entry.id, previous?.reading ?? 0);
  }
  return readings;
}
