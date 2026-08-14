import { describe, it, expect } from "vitest";
import { computeSummary } from "../billing.svelte";
import type { ExtendedBillingInfo, Status } from "#lib/types/billing-info.js";

function payment(id: string, amount: number) {
  return {
    id,
    amount,
    date: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function billingInfo(overrides: Partial<ExtendedBillingInfo>): ExtendedBillingInfo {
  return {
    id: "b",
    userId: "u1",
    date: new Date("2024-02-10T00:00:00.000Z"),
    totalkWh: 100,
    balance: 100,
    status: "paid",
    payPerkWh: 1,
    paymentId: "p-main",
    createdAt: new Date(),
    updatedAt: new Date(),
    payment: payment("p-main", 90),
    subMeters: [],
    ...overrides,
  };
}

function subMeter(id: string, reading: number, amount: number) {
  return {
    id,
    tenantUserId: `t-${id}`,
    billingInfoId: "b",
    tenantName: id,
    subkWh: reading,
    reading,
    status: "paid" as Status,
    paymentId: `p-${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    payment: payment(`p-${id}`, amount),
  };
}

describe("computeSummary", () => {
  it("returns zeros for empty infos", () => {
    const summary = computeSummary([]);
    expect(summary).toEqual({
      current: 0,
      invested: 0,
      totalReturns: 0,
      netReturns: 0,
      oneDayReturns: 0,
      averageDailyReturn: 0,
      averageMonthlyReturn: 0,
      periodPaymentChange: 0,
      periodPaymentChangePct: 0,
    });
  });

  it("treats missing payments as zero", () => {
    const summary = computeSummary([
      billingInfo({
        payment: undefined,
        subMeters: [{ ...subMeter("A", 10, 0), payment: undefined }],
      }),
    ]);
    expect(summary.invested).toBe(0);
    expect(summary.totalReturns).toBe(0);
  });

  it("computes invested, returns and rate from actual payments", () => {
    const infos = [
      billingInfo({
        date: new Date("2024-02-10T00:00:00.000Z"),
        payment: payment("p-main", 90),
        subMeters: [subMeter("A", 10, 10)],
      }),
      billingInfo({
        id: "b2",
        date: new Date("2024-01-10T00:00:00.000Z"),
        payment: payment("p-main-2", 60),
        subMeters: [subMeter("A", 10, 20)],
      }),
    ];

    const summary = computeSummary(infos);

    // invested = (90 + 10) + (60 + 20)
    expect(summary.invested).toBe(180);
    // returns = sub payments 10 + 20
    expect(summary.totalReturns).toBe(30);
    expect(summary.netReturns).toBeCloseTo((30 / 180) * 100, 5);
    // latest period sub payments
    expect(summary.oneDayReturns).toBe(10);
    // date span 2024-01-10 -> 2024-02-10 = 31 days
    expect(summary.averageDailyReturn).toBeCloseTo(30 / 31, 5);
    expect(summary.averageMonthlyReturn).toBeCloseTo(30 / (31 / 30), 5);
    // latest total 100, previous total 80 -> change -20, pct -25%
    expect(summary.periodPaymentChange).toBe(-20);
    expect(summary.periodPaymentChangePct).toBeCloseTo(-25, 5);
  });

  it("uses the latest balance as current", () => {
    const summary = computeSummary([
      billingInfo({ balance: 123.45 }),
      billingInfo({ id: "b2", balance: 50 }),
    ]);
    expect(summary.current).toBe(123.45);
  });

  it("handles a single record (no previous period)", () => {
    const summary = computeSummary([
      billingInfo({ payment: payment("p-main", 90), subMeters: [subMeter("A", 10, 10)] }),
    ]);
    // previous period == latest period -> no change
    expect(summary.periodPaymentChange).toBe(0);
    expect(summary.periodPaymentChangePct).toBe(0);
  });
});
