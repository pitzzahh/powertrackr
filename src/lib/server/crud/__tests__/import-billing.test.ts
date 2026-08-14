import { describe, it, expect } from "vitest";
import { importBillingHandler } from "#lib/server/data-import.js";
import { createBillingInfoLogic, getBillingInfoBy } from "#lib/server/crud/billing-info-crud.js";
import { addUser } from "#lib/server/crud/user-crud.js";
import { createUser, createTenantUser } from "#lib/server/crud/__tests__/helpers/factories.js";

// Mirrors the reported sample: latest record (2026-09-01) has NO sub-meters,
// while older records bill "Lola's House".
const items = [
  {
    date: "2026-08-04T00:00:00.000Z",
    totalkWh: 108,
    balance: 1414.31,
    status: "paid",
    subMeters: [{ label: "Lola's House", reading: 6767 }],
  },
  {
    date: "2026-09-01T00:00:00.000Z",
    totalkWh: 232,
    balance: 2523.23,
    status: "pending",
    subMeters: [],
  },
];

describe("importBillingHandler", () => {
  it("links label-based sub-meters to existing tenants", async () => {
    const {
      value: [u],
    } = await addUser([createUser()]);
    const {
      value: [tenant],
    } = await addUser([createTenantUser(u.id, { name: "Lola's House" })]);

    const { created, skipped } = await importBillingHandler(items as any, u.id);

    expect(created).toHaveLength(2);
    expect(skipped).toEqual([]);

    const {
      value: [billed],
    } = await getBillingInfoBy({
      query: { id: created[0].id },
      options: { with_sub_meters: true },
    });
    expect(billed.subMeters?.[0]?.tenantUserId).toBe(tenant.id);
    expect(billed.subMeters?.[0]?.tenantName).toBe("Lola's House");
  });

  it("keeps the tenant baseline even when the latest record has no sub-meters", async () => {
    const {
      value: [u],
    } = await addUser([createUser()]);
    const {
      value: [tenant],
    } = await addUser([createTenantUser(u.id, { name: "Lola's House" })]);

    await importBillingHandler(items as any, u.id);

    // New record after the sub-meter-less 2026-09-01 record. The baseline must
    // be the last billed reading (6767), NOT 0, so usage = 6800 - 6767 = 33.
    const created = await createBillingInfoLogic(
      {
        date: "2026-10-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 6800, status: "pending" }],
      },
      u.id
    );

    const {
      value: [latest],
    } = await getBillingInfoBy({
      query: { id: created.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });
    expect(latest.subMeters?.[0]?.subkWh).toBe(33);
    expect(latest.subMeters?.[0]?.payment?.amount).toBeCloseTo(33 * 10, 2);
    expect(latest.payment?.amount).toBeCloseTo(2000 - 330, 2);
  });

  it("skips sub-meter labels that match no tenant", async () => {
    const {
      value: [u],
    } = await addUser([createUser()]);

    const { created, skipped } = await importBillingHandler(items as any, u.id);

    expect(created).toHaveLength(2);
    expect(skipped).toEqual([{ label: "Lola's House" }]);
  });
});
