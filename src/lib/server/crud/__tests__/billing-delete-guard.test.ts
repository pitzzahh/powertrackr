import { describe, it, expect } from "vitest";
import { createBillingInfoLogic, assertBillingsDeletable } from "../billing-logic";
import { addUser, deleteUserBy } from "../user-crud";
import { db } from "#lib/server/db/index.js";
import { payment } from "#lib/server/db/schema/index.js";
import { createUser, createTenantUser } from "#lib/server/crud/__tests__/helpers/factories.js";

async function seedChain() {
  const {
    value: [owner],
  } = await addUser([createUser()]);
  const {
    value: [tenant],
  } = await addUser([createTenantUser(owner.id)]);
  const bill = (date: string, reading: number) =>
    createBillingInfoLogic(
      {
        date,
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading, status: "pending" }],
      },
      owner.id
    );
  const jan = await bill("2024-01-01", 100);
  const feb = await bill("2024-02-01", 150);
  const mar = await bill("2024-03-01", 200);
  return { owner, tenant, jan, feb, mar };
}

describe("assertBillingsDeletable", () => {
  it("refuses deleting a billing a later one uses as baseline", async () => {
    const { owner, feb } = await seedChain();
    await expect(assertBillingsDeletable(owner.id, [feb.id])).rejects.toMatchObject({
      status: 400,
    });
  });

  it("allows the latest billing, or a middle one deleted with every later one", async () => {
    const { owner, feb, mar } = await seedChain();
    await expect(assertBillingsDeletable(owner.id, [mar.id])).resolves.toBeUndefined();
    await expect(assertBillingsDeletable(owner.id, [feb.id, mar.id])).resolves.toBeUndefined();
  });
});

describe("deleteUserBy payment cleanup", () => {
  it("removes an owner's main and sub payments", async () => {
    const { owner } = await seedChain();
    expect((await db().select().from(payment)).length).toBeGreaterThan(0);
    await deleteUserBy({ query: { id: owner.id } });
    expect(await db().select().from(payment)).toHaveLength(0);
  });

  it("removes a deleted tenant's payments only", async () => {
    const { tenant } = await seedChain();
    const before = (await db().select().from(payment)).length;
    await deleteUserBy({ query: { id: tenant.id } });
    // 3 sub payments gone; the owner's 3 main payments stay.
    expect(await db().select().from(payment)).toHaveLength(before - 3);
  });
});
