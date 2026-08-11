import { describe, it, expect } from "vitest";
import { findPreviousBillingInfo, resolvePreviousReadings } from "../previous-reading";

describe("findPreviousBillingInfo", () => {
  const infos = [
    { date: new Date("2024-01-01"), subMeters: [] },
    { date: new Date("2024-03-01"), subMeters: [] },
    { date: new Date("2024-02-01"), subMeters: [] },
  ];

  it("returns the record with the greatest date strictly before the current date", () => {
    const previous = findPreviousBillingInfo(infos, new Date("2024-03-01"));
    expect(previous).toEqual(infos[2]);
  });

  it("ignores records on the same date as the current record", () => {
    const previous = findPreviousBillingInfo(infos, "2024-02-01T00:00:00.000Z");
    expect(previous).toEqual(infos[0]);
  });

  it("returns undefined when no earlier record exists", () => {
    const previous = findPreviousBillingInfo(infos, new Date("2023-12-31"));
    expect(previous).toBeUndefined();
  });

  it("returns undefined for empty input", () => {
    expect(findPreviousBillingInfo([], new Date())).toBeUndefined();
  });
});

describe("resolvePreviousReadings", () => {
  const entries = [
    { id: "s1", tenantUserId: "t1", reading: 300 },
    { id: "s2", tenantUserId: "t2", reading: 500 },
    { id: "s3", tenantUserId: "t3", reading: 50 },
  ];

  it("maps previous readings by tenantUserId keyed by id", () => {
    const readings = resolvePreviousReadings(entries, [
      { tenantUserId: "t1", reading: 100 },
      { tenantUserId: "t2", reading: 200 },
    ]);
    expect(readings.get("s1")).toBe(100);
    expect(readings.get("s2")).toBe(200);
    expect(readings.get("s3")).toBe(0);
  });

  it("matches only identical tenantUserIds", () => {
    const readings = resolvePreviousReadings(
      [{ id: "s1", tenantUserId: "t1", reading: 300 }],
      [{ tenantUserId: "other", reading: 100 }]
    );
    expect(readings.get("s1")).toBe(0);
  });

  it("resolves 0 when there is no previous period", () => {
    const readings = resolvePreviousReadings(entries, []);
    expect(readings.get("s1")).toBe(0);
    expect(readings.get("s2")).toBe(0);
    expect(readings.get("s3")).toBe(0);
  });

  it("skips entries without an id", () => {
    const readings = resolvePreviousReadings(
      [{ tenantUserId: "t9", reading: 10 }],
      [{ tenantUserId: "t9", reading: 5 }]
    );
    expect(readings.size).toBe(0);
  });
});
