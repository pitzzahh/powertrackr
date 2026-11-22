import { CalendarDate } from "@internationalized/date";
import type { SubMeterForm } from "#lib/types/billing-info.js";

/** Midnight UTC of a calendar date as an ISO string; "" when unset. */
export function toUtcIso(date: CalendarDate | undefined): string {
  return date ? new Date(Date.UTC(date.year, date.month - 1, date.day)).toISOString() : "";
}

/** The UTC calendar day of a stored date (dates are saved at midnight UTC). */
export function toCalendarDate(value: Date | string): CalendarDate {
  const d = new Date(value);
  return new CalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** First day of the month after `value`, the default date for the next bill. */
export function firstOfNextMonth(value: Date | string): CalendarDate {
  const d = new Date(value);
  return new CalendarDate(
    d.getUTCFullYear() + (d.getUTCMonth() === 11 ? 1 : 0),
    ((d.getUTCMonth() + 1) % 12) + 1,
    1
  );
}

/** Sub-meter rows in the shape the remote form field expects. */
export function toFieldEntries(subMeters: SubMeterForm[]) {
  return subMeters.map((s) => ({
    id: s.isNew ? undefined : s.id,
    tenantUserId: s.tenantUserId,
    reading: s.reading ?? undefined,
    status: s.status,
  }));
}

/** True when the form's sub-meters differ from the saved ones in any way. */
export function subMetersChanged(saved: SubMeterForm[], form: SubMeterForm[]): boolean {
  if (saved.length !== form.length) return true;
  return form.some((s) => {
    const ex = s.id ? saved.find((o) => o.id === s.id) : undefined;
    return (
      !ex ||
      ex.tenantUserId !== s.tenantUserId ||
      Number(ex.reading) !== Number(s.reading) ||
      ex.status !== s.status
    );
  });
}
