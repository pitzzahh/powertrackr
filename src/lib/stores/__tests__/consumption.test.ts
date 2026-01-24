import { describe, it, expect } from "vitest";
import { computeConsumptionSummary } from "../consumption.svelte";

describe("computeConsumptionSummary", () => {
  it("returns zeros for empty infos", () => {
    const summary = computeConsumptionSummary([] as any);
    expect(summary.totalKWh).toBe(0);
    expect(summary.averageDailyKWh).toBe(0);
    expect(summary.totalSubMeters).toBe(0);
    expect(summary.latestReading).toBe(0);
  });

  it("computes correctly without sub-meters", () => {
    const infos = [
      { date: "2024-01-31", totalkWh: 150 },
      { date: "2024-01-01", totalkWh: 100 },
    ] as any;

    const summary = computeConsumptionSummary(infos);
    expect(summary.totalKWh).toBe(250);
    // Date range: 2024-01-01 -> 2024-01-31 = 30 days
    expect(summary.averageDailyKWh).toBeCloseTo(250 / 30);
    expect(summary.totalSubMeters).toBe(0);
    expect(summary.latestReading).toBe(150);
  });

  it("computes correctly when sub-meters exist", () => {
    const infos = [
      {
        date: "2024-02-10",
        totalkWh: 50,
        subMeters: [
          { id: "a", label: "A", subkWh: 10, reading: 110 },
          { id: "b", label: "B", subkWh: 15, reading: 105 },
        ],
      },
      {
        date: "2024-01-10",
        totalkWh: 40,
        subMeters: [{ id: "a", label: "A", subkWh: 12, reading: 100 }],
      },
    ] as any;

    const summary = computeConsumptionSummary(infos);
    expect(summary.totalKWh).toBe(90);
    // Date range: 2024-01-10 -> 2024-02-10 = 31 days
    expect(summary.averageDailyKWh).toBeCloseTo(90 / 31);
    expect(summary.totalSubMeters).toBe(2);
    expect(summary.latestReading).toBe(50);
  });

  it("counts unique sub-meters across entries (dedupes by id/label)", () => {
    const infos = [
      {
        date: "2024-02-10",
        totalkWh: 10,
        subMeters: [{ id: "a", label: "A" }],
      },
      {
        date: "2024-01-10",
        totalkWh: 5,
        subMeters: [{ id: "a", label: "A" }],
      },
    ] as any;

    const summary = computeConsumptionSummary(infos);
    expect(summary.totalSubMeters).toBe(1);
  });
});
