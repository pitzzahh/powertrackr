import { describe, it, expect } from "vitest";
import { toAreaChartData } from "../index";
import type { ExtendedBillingInfo } from "$/types/billing-info";

function billingInfo(overrides: Partial<ExtendedBillingInfo>): ExtendedBillingInfo {
  return {
    id: "b1",
    userId: "u1",
    date: new Date("2024-02-10T00:00:00.000Z"),
    totalkWh: 100,
    balance: 500,
    status: "paid",
    payPerkWh: 5,
    paymentId: "p1",
    createdAt: new Date(),
    updatedAt: new Date(),
    payment: { id: "p1", amount: 480, date: new Date(), createdAt: new Date(), updatedAt: new Date() },
    subMeters: [],
    ...overrides,
  };
}

describe("toAreaChartData", () => {
  it("maps the main payment and sub-meter payments by tenant name", () => {
    const data = toAreaChartData(
      billingInfo({
        subMeters: [
          {
            id: "r1",
            tenantUserId: "t1",
            billingInfoId: "b1",
            tenantName: "Lola",
            subkWh: 20,
            reading: 100,
            status: "paid",
            paymentId: "p2",
            createdAt: new Date(),
            updatedAt: new Date(),
            payment: { id: "p2", amount: 20, date: new Date(), createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      })
    );

    expect(data.payment).toBe(480);
    expect(data.subPayments).toEqual({ Lola: 20 });
  });

  it("treats a pending (unfinalized) billing as zero payment", () => {
    const data = toAreaChartData(
      billingInfo({
        paymentId: null,
        payment: null,
        status: "pending",
        subMeters: [
          {
            id: "r1",
            tenantUserId: "t1",
            billingInfoId: "b1",
            tenantName: "Lola",
            subkWh: null,
            reading: null,
            status: "pending",
            paymentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
    );

    expect(data.payment).toBe(0);
    expect(data.subPayments).toEqual({ Lola: 0 });
  });
});
