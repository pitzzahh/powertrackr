import { describe, it, expect } from "vitest";
import { parseImportItems } from "#lib/validators/import.js";
import type { ExtendedBillingInfo } from "#lib/types/billing-info.js";
import { buildExport } from "../build-export.js";

const at = new Date("2026-04-01T00:00:00.000Z");
const pay = (id: string, amount: number) => ({
  id,
  amount,
  date: at,
  createdAt: at,
  updatedAt: at,
});

const bill: ExtendedBillingInfo = {
  id: "b1",
  userId: "u1",
  date: at,
  totalkWh: 100,
  balance: 1200,
  payPerkWh: 12,
  status: "paid",
  paymentId: "p-main",
  createdAt: at,
  updatedAt: at,
  payment: pay("p-main", 960),
  subMeters: [
    {
      id: "s1",
      billingInfoId: "b1",
      tenantUserId: "t1",
      tenantName: "Unit A",
      subkWh: 20,
      reading: 1520,
      status: "paid",
      paymentId: "p-sub",
      createdAt: at,
      updatedAt: at,
      payment: pay("p-sub", 240),
    },
  ],
};

describe("buildExport", () => {
  it("writes items the import flow accepts back, sub-meters named by tenant", () => {
    const { payload } = buildExport([bill]);
    const [item] = parseImportItems(payload.items);
    expect(item?.subMeters).toEqual([{ label: "Unit A", reading: 1520, status: "paid" }]);
  });

  it("omits the reading of a pending sub-meter so it re-imports as pending", () => {
    const pendingSub = {
      ...bill.subMeters[0],
      reading: null,
      status: "pending" as const,
      paymentId: null,
      payment: undefined,
    };
    const { payload } = buildExport([{ ...bill, subMeters: [pendingSub] }]);
    const [item] = parseImportItems(payload.items);
    expect(item?.subMeters).toEqual([{ label: "Unit A", status: "pending" }]);
  });

  it("collects each payment once and counts the rows", () => {
    const { payload, preview } = buildExport([bill]);
    expect(payload.payments.map((p) => p.id)).toEqual(["p-main", "p-sub"]);
    expect(preview).toEqual({ billingInfos: 1, subMeters: 1, payments: 2 });
  });
});
