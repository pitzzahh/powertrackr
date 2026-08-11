import { describe, it, expect } from "vitest";
import {
  computeTenantUsages,
  getLastTenantReading,
  createBillingInfoLogic,
} from "../billing-info-crud";
import { calculatePayPerKwh } from "$lib";
import { addUser } from "../user-crud";
import { createUser, createTenantUser } from "./helpers/factories";

describe("calculatePayPerKwh", () => {
  it("divides balance by total kWh", () => {
    expect(calculatePayPerKwh(1200, 1200)).toBe(1);
    expect(calculatePayPerKwh(600, 1200)).toBe(0.5);
  });

  it("rounds to two decimals", () => {
    expect(calculatePayPerKwh(1000, 3)).toBe(333.33);
    expect(calculatePayPerKwh(1414.31, 108)).toBe(13.1);
  });
});

describe("computeTenantUsages", () => {
  const kitchen = { id: "t1", name: "Kitchen" };
  const garage = { id: "t2", name: "Garage" };

  it("treats tenants without a previous reading as a baseline (0 usage)", () => {
    const usages = computeTenantUsages([{ tenant: kitchen, reading: 100, prevReading: null }], 1);
    expect(usages.get("t1")).toEqual({ usage: 0, payment: 0 });
  });

  it("computes the reading delta as usage and applies the rate", () => {
    const usages = computeTenantUsages([{ tenant: kitchen, reading: 250, prevReading: 100 }], 1);
    expect(usages.get("t1")).toEqual({ usage: 150, payment: 150 });
  });

  it("rounds payments to cents", () => {
    const usages = computeTenantUsages(
      [{ tenant: kitchen, reading: 250, prevReading: 100 }],
      0.4567
    );
    expect(usages.get("t1")?.usage).toBe(150);
    expect(usages.get("t1")?.payment).toBe(68.5);
  });

  it("computes each tenant independently keyed by tenant id", () => {
    const usages = computeTenantUsages(
      [
        { tenant: kitchen, reading: 250, prevReading: 100 },
        { tenant: garage, reading: 400, prevReading: 200 },
      ],
      1
    );
    expect(usages.get("t1")).toEqual({ usage: 150, payment: 150 });
    expect(usages.get("t2")).toEqual({ usage: 200, payment: 200 });
  });

  it("rejects readings lower than the previous reading", () => {
    let caught: { body?: { message?: string } } | undefined;
    try {
      computeTenantUsages([{ tenant: kitchen, reading: 50, prevReading: 100 }], 1);
    } catch (e) {
      caught = e as { body?: { message?: string } };
    }
    expect(caught?.body?.message).toContain("Invalid reading for sub meter");
  });
});

describe("getLastTenantReading", () => {
  it("returns the most recent billed reading for the tenant before the given date", async () => {
    const {
      value: [owner],
    } = await addUser([createUser()]);
    const {
      value: [tenant],
    } = await addUser([createTenantUser(owner.id, { name: "Lola" })]);
    const {
      value: [otherTenant],
    } = await addUser([createTenantUser(owner.id, { name: "Mia" })]);

    // Jan: Lola billed at 100
    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 100, status: "pending" }],
      },
      owner.id
    );
    // Feb: Lola billed at 150
    await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 150, status: "pending" }],
      },
      owner.id
    );
    // Mar: does NOT include Lola (only Mia) — the baseline must still be Feb's 150
    await createBillingInfoLogic(
      {
        date: "2024-03-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: otherTenant.id, reading: 200, status: "pending" }],
      },
      owner.id
    );

    expect(await getLastTenantReading(owner.id, tenant.id, new Date("2024-04-01"))).toBe(150);
    expect(await getLastTenantReading(owner.id, tenant.id, new Date("2024-02-01"))).toBe(100);
    expect(await getLastTenantReading(owner.id, otherTenant.id, new Date("2024-04-01"))).toBe(200);
    expect(await getLastTenantReading(owner.id, tenant.id, new Date("2024-01-01"))).toBeNull();
  });

  it("skips pending (null-reading) rows when searching for the baseline", async () => {
    const {
      value: [owner],
    } = await addUser([createUser()]);
    const {
      value: [tenant],
    } = await addUser([createTenantUser(owner.id, { name: "Lola" })]);

    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 100, status: "pending" }],
      },
      owner.id
    );
    // Pending billing after the billed one — its null reading must not win
    await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: null, status: "pending" }],
      },
      owner.id
    );

    expect(await getLastTenantReading(owner.id, tenant.id, new Date("2024-03-01"))).toBe(100);
  });
});
