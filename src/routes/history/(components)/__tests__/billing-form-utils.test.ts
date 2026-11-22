import { describe, it, expect } from "vitest";
import { CalendarDate } from "@internationalized/date";
import {
  firstOfNextMonth,
  subMetersChanged,
  toCalendarDate,
  toUtcIso,
} from "../billing-form-utils.js";

const row = (id: string, reading: number | null = 10) => ({
  id,
  tenantUserId: `t-${id}`,
  reading,
  status: "pending" as const,
});

describe("billing form dates", () => {
  it("round-trips a stored midnight-UTC date", () => {
    expect(toUtcIso(toCalendarDate("2026-03-05T00:00:00.000Z"))).toBe("2026-03-05T00:00:00.000Z");
    expect(toUtcIso(undefined)).toBe("");
  });

  it("defaults the next bill to the first of the following month, across years", () => {
    expect(firstOfNextMonth("2026-05-20T00:00:00.000Z")).toEqual(new CalendarDate(2026, 6, 1));
    expect(firstOfNextMonth("2026-12-15T00:00:00.000Z")).toEqual(new CalendarDate(2027, 1, 1));
  });
});

describe("subMetersChanged", () => {
  it("is false for the same rows", () => {
    expect(subMetersChanged([row("a"), row("b")], [row("a"), row("b")])).toBe(false);
  });

  it("catches an edited reading, an added row and a swapped row", () => {
    expect(subMetersChanged([row("a")], [row("a", 11)])).toBe(true);
    expect(subMetersChanged([row("a")], [row("a"), row("b")])).toBe(true);
    expect(subMetersChanged([row("a")], [row("b")])).toBe(true);
  });
});
