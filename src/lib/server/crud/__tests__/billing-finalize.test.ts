import { describe, it, expect } from "vitest";
import {
  createBillingInfoLogic,
  updateBillingInfoLogic,
  finalizeBillingInfoLogic,
  getBillingInfoBy,
} from "$/server/crud/billing-info-crud";
import { db } from "$/server/db";
import { tenantReading, payment } from "$/server/db/schema";
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

  it("finalizes only pending rows when others were materialized at submission", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();
    const {
      value: [tenant2],
    } = await addUser([createTenantUser(owner.id, { name: "Mia" })]);

    // Period A: billed baseline 100 for Lola, 200 for Mia
    await createBillingInfoLogic(
      {
        date: "2026-08-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [
          { tenantUserId: tenant.id, reading: 100, status: "pending" },
          { tenantUserId: tenant2.id, reading: 200, status: "pending" },
        ],
      },
      owner.id
    );

    // Period B pending; Lola's row already materialized (as if submitted:
    // reading + payment set), Mia's still pending
    const billingB = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 2000,
        balance: 2000,
        status: "pending",
        subMeters: [
          { tenantUserId: tenant.id, reading: null, status: "pending" },
          { tenantUserId: tenant2.id, reading: null, status: "pending" },
        ],
      },
      owner.id
    );

    const billingRows =
      (await getBillingInfoBy({ query: { id: billingB.id }, options: { with_sub_meters: true } }))
        .value[0].subMeters ?? [];
    const lolaRow = billingRows.find((s) => s.tenantUserId === tenant.id)!;
    const lolaPaymentId = crypto.randomUUID();
    await db().batch([
      db().insert(payment).values({ id: lolaPaymentId, amount: 150, date: new Date() }),
      db()
        .update(tenantReading)
        .set({ reading: 250, subkWh: 150, paymentId: lolaPaymentId, status: "paid" })
        .where(eq(tenantReading.id, lolaRow.id)),
    ]);

    // Mia submits 350 -> usage 350 - 200 = 150 at rate 2000/2000 = 1.0
    await db()
      .update(tenantReading)
      .set({ reading: 350 })
      .where(eq(tenantReading.billingInfoId, billingB.id));

    const finalized = await finalizeBillingInfoLogic(billingB.id, owner.id);

    const {
      value: [billing],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });
    const subs = billing.subMeters ?? [];
    const lola = subs.find((s) => s.tenantUserId === tenant.id)!;
    const mia = subs.find((s) => s.tenantUserId === tenant2.id)!;

    // Lola's payment was created at submission and left untouched
    expect(lola.subkWh).toBe(150);
    expect(lola.payment?.amount).toBeCloseTo(150, 2);
    // Mia's row got materialized by finalize
    expect(mia.subkWh).toBe(150);
    expect(mia.payment?.amount).toBeCloseTo(150, 2);
    // Main = balance - (150 + 150) = 1700
    expect(billing.payment?.amount).toBeCloseTo(1700, 2);
    expect(finalized.paymentId).not.toBeNull();
  });

  it("lets the owner fill pending readings via update and auto-finalizes", async () => {
    const { owner, tenant } = await seedOwnerWithTenant();

    // Period A: billed baseline 100
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

    // Period B: pending, waiting for the reading
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

    const billingRows =
      (
        await getBillingInfoBy({ query: { id: billingB.id }, options: { with_sub_meters: true } })
      ).value[0].subMeters ?? [];
    const row = billingRows[0]!;

    // Owner sets the reading instead of waiting for the tenant
    const updated = await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2026-09-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ id: row.id, tenantUserId: tenant.id, reading: 300, status: "pending" }],
      },
      owner.id
    );

    // All readings in -> auto-finalized: main payment created, marked paid
    expect(updated.paymentId).not.toBeNull();
    expect(updated.status).toBe("paid");

    const {
      value: [billing],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });
    expect(billing.subMeters?.[0]?.reading).toBe(300);
    expect(billing.subMeters?.[0]?.subkWh).toBe(200);
    expect(billing.subMeters?.[0]?.payment?.amount).toBeCloseTo(200, 2);
    expect(billing.payment?.amount).toBeCloseTo(1000, 2);
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
