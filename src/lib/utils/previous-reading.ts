export type SubMeterReadingLike = {
  id?: string;
  label: string;
  reading: number;
};

export type BillingInfoLike = {
  date: Date | string;
  subMeters?: SubMeterReadingLike[];
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
 * Resolves the previous period's reading for each sub meter (matched by label),
 * keyed by sub meter id. Meters with no matching label in the previous period
 * (or without an id) resolve to 0 (baseline).
 */
export function resolvePreviousReadings(
  subMeters: SubMeterReadingLike[],
  previousSubMeters: SubMeterReadingLike[]
): Map<string, number> {
  const readings = new Map<string, number>();
  for (const sub of subMeters) {
    if (!sub.id) continue;
    const previous = previousSubMeters.find((p) => p.label === sub.label);
    readings.set(sub.id, previous?.reading ?? 0);
  }
  return readings;
}
