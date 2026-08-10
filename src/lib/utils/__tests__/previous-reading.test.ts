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
  const subMeters = [
    { id: "s1", label: "Kitchen", reading: 300 },
    { id: "s2", label: "Garage", reading: 500 },
    { id: "s3", label: "Shed", reading: 50 },
  ];

  it("maps previous readings by label keyed by id", () => {
    const readings = resolvePreviousReadings(subMeters, [
      { label: "Kitchen", reading: 100 },
      { label: "Garage", reading: 200 },
    ]);
    expect(readings.get("s1")).toBe(100);
    expect(readings.get("s2")).toBe(200);
    expect(readings.get("s3")).toBe(0);
  });

  it("resolves 0 when there is no previous period", () => {
    const readings = resolvePreviousReadings(subMeters, []);
    expect(readings.get("s1")).toBe(0);
    expect(readings.get("s2")).toBe(0);
    expect(readings.get("s3")).toBe(0);
  });

  it("skips sub meters without an id", () => {
    const readings = resolvePreviousReadings(
      [{ label: "New", reading: 10 }],
      [{ label: "New", reading: 5 }]
    );
    expect(readings.size).toBe(0);
  });
});
