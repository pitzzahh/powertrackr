import { describe, it, expect } from "vitest";
import {
  createBillingInfoLogic,
  finalizeBillingInfoLogic,
  getBillingInfoBy,
} from "$/server/crud/billing-info-crud";
import { db } from "$/server/db";
import { tenantReading } from "$/server/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentBy } from "$/server/crud/payment-crud";
import { addUser } from "$/server/crud/user-crud";
import { createUser, createTenantUser } from "$/server/crud/__tests__/helpers/factories";

async function seedOwnerWithTenant() {
  const {
    value: [owner],
  } = await addUser([createUser()]);
  const {
    value: [tenant],
  } = await addUser([createTenantUser(owner.id, { name: "Lola" })]);
  return { owner, tenant };
}

describe("pending billings", () => {
  it("creates a billing shell with pending tenant rows when readings are omitted", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();

    const created = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: null, status: "pending" }],
      },
      owner.id
    );

    expect(created.paymentId).toBeNull();

    const {
      value: [billing],
    } = await getBillingInfoBy({
      query: { id: created.id },
      options: { with_sub_meters: true },
    });
    expect(billing.subMeters).toHaveLength(1);
    expect(billing.subMeters?.[0]?.reading).toBeNull();
    expect(billing.subMeters?.[0]?.subkWh).toBeNull();
    expect(billing.subMeters?.[0]?.paymentId).toBeNull();
  });

  it("rejects a mix of submitted and pending readings", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();
    const {
      value: [tenant2],
    } = await addUser([createTenantUser(owner.id, { name: "Mia" })]);

    await expect(
      createBillingInfoLogic(
        {
          date: "2026-09-01",
          totalkWh: 200,
          balance: 2000,
          status: "pending",
          subMeters: [
            { tenantUserId: tenant.id, reading: 100, status: "pending" },
            { tenantUserId: tenant2.id, reading: null, status: "pending" },
          ],
        },
        owner.id
      )
    ).rejects.toMatchObject({
      body: {
        message: expect.stringContaining("provide readings for every sub meter") as unknown,
      },
    });
  });

  it("finalizes a pending billing using the submitted reading and previous billed baseline", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();

    // Period A: billed eagerly at 100
    await createBillingInfoLogic(
      {
        date: "2026-08-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 100, status: "pending" }],
      },
      owner.id
    );

    // Period B: pending — tenant submits 300
    const billingB = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: null, status: "pending" }],
      },
      owner.id
    );

    await db()
      .update(tenantReading)
      .set({ reading: 300 })
      .where(eq(tenantReading.billingInfoId, billingB.id));

    const finalized = await finalizeBillingInfoLogic(billingB.id, owner.id);

    expect(finalized.paymentId).not.toBeNull();
    expect(finalized.status).toBe("paid");
    // usage = 300 - 100 = 200 at rate 1200/1200 = 1.0
    expect(finalized.payPerkWh).toBeCloseTo(1, 4);

    const {
      value: [billing],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });
    expect(billing.subMeters?.[0]?.reading).toBe(300);
    expect(billing.subMeters?.[0]?.subkWh).toBe(200);
    expect(billing.subMeters?.[0]?.payment?.amount).toBeCloseTo(200, 2);
    expect(billing.payment?.amount).toBeCloseTo(1200 - 200, 2);

    const mainPay = (await getPaymentBy({ query: { id: billing.paymentId ?? "" }, options: {} }))
      .value[0];
    expect(mainPay.amount).toBeCloseTo(1000, 2);
  });

  it("rejects finalizing a billing with no submitted readings", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();

    const billing = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: null, status: "pending" }],
      },
      owner.id
    );

    await expect(finalizeBillingInfoLogic(billing.id, owner.id)).rejects.toMatchObject({
      body: { message: expect.stringContaining("No tenant readings to finalize") as unknown },
    });
  });

  it("rejects finalizing an already finalized billing", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();

    const billing = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: null, status: "pending" }],
      },
      owner.id
    );

    await db()
      .update(tenantReading)
      .set({ reading: 300 })
      .where(eq(tenantReading.billingInfoId, billing.id));
    await finalizeBillingInfoLogic(billing.id, owner.id);

    await expect(finalizeBillingInfoLogic(billing.id, owner.id)).rejects.toMatchObject({
      body: { message: expect.stringContaining("Billing info is already finalized") as unknown },
    });
  });
});
