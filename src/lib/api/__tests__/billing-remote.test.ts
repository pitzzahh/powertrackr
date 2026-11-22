import { describe, it, expect, vi } from "vitest";
import { isHttpError } from "@sveltejs/kit";
import { eq, inArray } from "drizzle-orm";

const state = vi.hoisted(() => ({ event: null as unknown }));

vi.mock("$app/server", async () => {
  const { remoteServerMock } =
    await import("#lib/server/crud/__tests__/helpers/remote-handlers.js");
  return remoteServerMock(() => state.event);
});

import { submitReading } from "#lib/api/tenant.remote.js";
import { deleteBillingInfo } from "#lib/api/billing-info.remote.js";
import {
  createBillingInfoLogic,
  finalizeBillingInfoLogic,
  updateBillingInfoLogic,
} from "#lib/server/crud/billing-logic.js";
import { addUser } from "#lib/server/crud/user-crud.js";
import { addSession } from "#lib/server/crud/session-crud.js";
import { db } from "#lib/server/db/index.js";
import { billingInfo, payment, tenantReading } from "#lib/server/db/schema/index.js";
import {
  createUser,
  createTenantUser,
  createSession,
} from "#lib/server/crud/__tests__/helpers/factories.js";
import { issues, makeEvent } from "#lib/server/crud/__tests__/helpers/remote-handlers.js";

type Handler = (data: unknown, issues?: unknown) => Promise<unknown>;

async function seed() {
  const {
    value: [owner],
  } = await addUser([createUser({ githubId: null, emailVerified: true })]);
  const {
    value: [tenant],
  } = await addUser([createTenantUser(owner.id, { githubId: null, emailVerified: true })]);
  return { owner, tenant };
}

async function signInAs(u: { id: string; email: string; name: string; ownerId?: string | null }) {
  const {
    value: [s],
  } = await addSession([createSession({ userId: u.id })]);
  state.event = makeEvent({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      image: null,
      emailVerified: true,
      registeredTwoFactor: false,
      ownerId: u.ownerId ?? null,
      isOauthUser: false,
    },
    session: s,
  });
}

async function pendingBilling(ownerId: string, tenantId: string, date = "2026-09-01") {
  return createBillingInfoLogic(
    {
      date,
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ tenantUserId: tenantId, status: "pending" }],
    },
    ownerId
  );
}

const paymentCount = async () => (await db().select({ id: payment.id }).from(payment)).length;

describe("submitReading", () => {
  it("a repeat submit for the same billing is refused and adds no payment", async () => {
    const { owner, tenant } = await seed();
    const billing = await pendingBilling(owner.id, tenant.id);
    await signInAs(tenant);

    await (submitReading as unknown as Handler)({ billingInfoId: billing.id, reading: 50 }, issues);
    const afterFirst = await paymentCount();

    await expect(
      (submitReading as unknown as Handler)({ billingInfoId: billing.id, reading: 60 }, issues)
    ).rejects.toSatisfy((e) => isHttpError(e) && e.status === 400);
    expect(await paymentCount()).toBe(afterFirst);
  });

  it("a billing of another owner is refused", async () => {
    const { owner, tenant } = await seed();
    const other = await seed();
    const foreign = await pendingBilling(other.owner.id, other.tenant.id);
    await signInAs(tenant);
    void owner;

    await expect(
      (submitReading as unknown as Handler)({ billingInfoId: foreign.id, reading: 10 }, issues)
    ).rejects.toSatisfy((e) => isHttpError(e) && e.status === 400);
    expect(await paymentCount()).toBe(0);
  });
});

describe("submitReading after finalize", () => {
  it("refuses a pending tenant once the billing is finalized", async () => {
    const { owner, tenant } = await seed();
    const {
      value: [tenantB],
    } = await addUser([createTenantUser(owner.id, { githubId: null, emailVerified: true })]);
    // An earlier reading gives tenant A real usage (and a payment) to finalize.
    await createBillingInfoLogic(
      {
        date: "2026-08-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 10, status: "pending" }],
      },
      owner.id
    );
    const billing = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [
          { tenantUserId: tenant.id, status: "pending" },
          { tenantUserId: tenantB.id, status: "pending" },
        ],
      },
      owner.id
    );
    await signInAs(tenant);
    await (submitReading as unknown as Handler)({ billingInfoId: billing.id, reading: 50 }, issues);
    await finalizeBillingInfoLogic(billing.id, owner.id);
    const afterFinalize = await paymentCount();

    await signInAs(tenantB);
    await expect(
      (submitReading as unknown as Handler)({ billingInfoId: billing.id, reading: 30 }, issues)
    ).rejects.toSatisfy((e) => isHttpError(e) && e.status === 409);
    expect(await paymentCount()).toBe(afterFinalize);
  });
});

describe("finalizeBillingInfoLogic", () => {
  it("two concurrent finalizes leave exactly one main payment", async () => {
    const { owner, tenant } = await seed();
    const billing = await pendingBilling(owner.id, tenant.id);
    await db()
      .update(tenantReading)
      .set({ reading: 40 })
      .where(eq(tenantReading.billingInfoId, billing.id));

    const results = await Promise.allSettled([
      finalizeBillingInfoLogic(billing.id, owner.id),
      finalizeBillingInfoLogic(billing.id, owner.id),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    // One main payment + one sub payment; the loser's rows were removed.
    expect(await paymentCount()).toBe(2);
  });
});

describe("deleteBillingInfo", () => {
  it("cannot delete another owner's billing", async () => {
    const mine = await seed();
    const theirs = await seed();
    const foreign = await pendingBilling(theirs.owner.id, theirs.tenant.id);
    await signInAs(mine.owner);

    const result = (await (deleteBillingInfo as unknown as Handler)({
      id: foreign.id,
      count: 1,
    })) as {
      value: number;
    };

    expect(result.value).toBe(0);
    expect(
      await db().select().from(billingInfo).where(eq(billingInfo.id, foreign.id))
    ).toHaveLength(1);
  });

  it("removes the billing's main and sub payments too", async () => {
    const { owner, tenant } = await seed();
    await createBillingInfoLogic(
      {
        date: "2026-08-01",
        totalkWh: 200,
        balance: 2000,
        status: "paid",
        subMeters: [{ tenantUserId: tenant.id, reading: 10, status: "paid" }],
      },
      owner.id
    );
    const billing = await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 200,
        balance: 2000,
        status: "paid",
        subMeters: [{ tenantUserId: tenant.id, reading: 30, status: "paid" }],
      },
      owner.id
    );
    const [sub] = await db()
      .select({ paymentId: tenantReading.paymentId })
      .from(tenantReading)
      .where(eq(tenantReading.billingInfoId, billing.id));
    await signInAs(owner);

    await (deleteBillingInfo as unknown as Handler)({ id: billing.id, count: 1 });

    const left = await db()
      .select()
      .from(payment)
      .where(inArray(payment.id, [billing.paymentId!, sub.paymentId!]));
    expect(left).toHaveLength(0);
  });
});

describe("updateBillingInfoLogic", () => {
  it("refuses to change a reading that a later billing uses as its baseline", async () => {
    const { owner, tenant } = await seed();
    const jan = await createBillingInfoLogic(
      {
        date: "2026-01-01",
        totalkWh: 200,
        balance: 2000,
        status: "paid",
        subMeters: [{ tenantUserId: tenant.id, reading: 100, status: "paid" }],
      },
      owner.id
    );
    await createBillingInfoLogic(
      {
        date: "2026-02-01",
        totalkWh: 200,
        balance: 2000,
        status: "paid",
        subMeters: [{ tenantUserId: tenant.id, reading: 150, status: "paid" }],
      },
      owner.id
    );
    const [janRow] = await db()
      .select({ id: tenantReading.id })
      .from(tenantReading)
      .where(eq(tenantReading.billingInfoId, jan.id));

    await expect(
      updateBillingInfoLogic(
        {
          id: jan.id,
          date: "2026-01-01",
          totalkWh: 200,
          balance: 2000,
          status: "paid",
          subMeters: [{ id: janRow.id, tenantUserId: tenant.id, reading: 120, status: "paid" }],
        },
        owner.id
      )
    ).rejects.toSatisfy((e) => isHttpError(e) && e.status === 400);
  });
});
