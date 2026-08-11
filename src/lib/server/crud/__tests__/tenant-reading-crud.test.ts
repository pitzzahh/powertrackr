import { describe, it, expect, beforeEach } from "vitest";
import {
  addTenantReading,
  updateTenantReadingBy,
  getTenantReadingBy,
  getTenantReadingCountBy,
  deleteTenantReadingBy,
} from "../tenant-reading-crud";
import {
  createUser,
  createTenantUser,
  createTenantReading,
  resetSequence,
} from "./helpers/factories";
import { addUser } from "../user-crud";
import { addPayment } from "../payment-crud";
import { addBillingInfo } from "../billing-info-crud";
import { createBillingInfo } from "./helpers/factories";

async function seed() {
  const {
    value: [owner],
  } = await addUser([createUser()]);
  const {
    value: [tenant],
  } = await addUser([createTenantUser(owner.id, { name: "Lola" })]);
  const {
    value: [payment],
  } = await addPayment([{ amount: 100, date: new Date() }]);
  const {
    value: [billing],
  } = await addBillingInfo([createBillingInfo({ userId: owner.id, paymentId: payment.id })]);
  return { owner, tenant, payment, billing };
}

describe("Tenant Reading CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addTenantReading", () => {
    it("adds a single tenant reading", async () => {
      const { tenant, billing } = await seed();

      const result = await addTenantReading([
        createTenantReading({
          tenantUserId: tenant.id,
          billingInfoId: billing.id,
          subkWh: 20,
          reading: 1500,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].tenantUserId).toBe(tenant.id);
      expect(result.value[0].billingInfoId).toBe(billing.id);
      expect(result.value[0].subkWh).toBe(20);
      expect(result.value[0].reading).toBe(1500);
    });

    it("adds multiple tenant readings", async () => {
      const { tenant, billing } = await seed();
      const {
        value: [tenant2],
      } = await addUser([createTenantUser(tenant.id, { name: "Mia" })]);

      const result = await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id, subkWh: 10 }),
        createTenantReading({ tenantUserId: tenant2.id, billingInfoId: billing.id, subkWh: 20 }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("returns valid true with empty array when no data provided", async () => {
      const result = await addTenantReading([]);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(0);
    });

    it("allows pending readings (null reading and payment)", async () => {
      const { tenant, billing } = await seed();

      const result = await addTenantReading([
        createTenantReading({
          tenantUserId: tenant.id,
          billingInfoId: billing.id,
          reading: null,
          subkWh: null,
          paymentId: null,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.value[0].reading).toBeNull();
      expect(result.value[0].subkWh).toBeNull();
      expect(result.value[0].paymentId).toBeNull();
    });

    it("throws when the tenant does not exist", async () => {
      const { billing } = await seed();

      await expect(
        addTenantReading([
          createTenantReading({ tenantUserId: "missing-tenant", billingInfoId: billing.id }),
        ])
      ).rejects.toThrow();
    });
  });

  describe("getTenantReadingBy", () => {
    it("finds by id and by billingInfoId", async () => {
      const { tenant, billing } = await seed();
      const {
        value: [added],
      } = await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id, subkWh: 15 }),
      ]);

      const byId = await getTenantReadingBy({ query: { id: added.id }, options: {} });
      expect(byId.valid).toBe(true);
      expect(byId.value[0].subkWh).toBe(15);

      const byBilling = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: {},
      });
      expect(byBilling.valid).toBe(true);
      expect(byBilling.value).toHaveLength(1);
    });

    it("returns valid false when nothing matches", async () => {
      const result = await getTenantReadingBy({ query: { id: "nope" }, options: {} });
      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
    });

    it("loads payment, tenant, and billing info relations", async () => {
      const { owner, tenant, payment, billing } = await seed();
      await addTenantReading([
        createTenantReading({
          tenantUserId: tenant.id,
          billingInfoId: billing.id,
          paymentId: payment.id,
        }),
      ]);

      const withPayment = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { with_payment: true },
      });
      expect(withPayment.value[0].payment?.amount).toBe(100);

      const withTenant = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { with_tenant: true },
      });
      expect(withTenant.value[0].tenant?.name).toBe("Lola");

      const withBilling = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { with_billing_info: true },
      });
      expect(withBilling.value[0].billingInfo?.userId).toBe(owner.id);
    });

    it("supports fields, limit and order", async () => {
      const { owner, tenant, billing } = await seed();
      const {
        value: [tenant2],
      } = await addUser([createTenantUser(owner.id, { name: "Mia" })]);

      await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id, subkWh: 1 }),
        createTenantReading({ tenantUserId: tenant2.id, billingInfoId: billing.id, subkWh: 2 }),
      ]);

      const fieldsOnly = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { fields: ["subkWh"] },
      });
      expect(fieldsOnly.value[0]).toHaveProperty("subkWh");
      expect(fieldsOnly.value[0]).not.toHaveProperty("reading");

      const limited = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { limit: 1 },
      });
      expect(limited.value).toHaveLength(1);

      const ordered = await getTenantReadingBy({
        query: { billingInfoId: billing.id },
        options: { order: "asc" },
      });
      expect(ordered.value[0].subkWh).toBe(1);
    });
  });

  describe("updateTenantReadingBy", () => {
    it("updates reading and subkWh by id", async () => {
      const { tenant, billing } = await seed();
      const {
        value: [added],
      } = await addTenantReading([
        createTenantReading({
          tenantUserId: tenant.id,
          billingInfoId: billing.id,
          subkWh: 10,
          reading: 100,
        }),
      ]);

      const result = await updateTenantReadingBy(
        { query: { id: added.id }, options: {} },
        { subkWh: 25, reading: 150 }
      );

      expect(result.valid).toBe(true);
      expect(result.value[0].subkWh).toBe(25);
      expect(result.value[0].reading).toBe(150);
    });

    it("updates by tenantUserId", async () => {
      const { tenant, billing } = await seed();
      await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id, subkWh: 10 }),
      ]);

      const result = await updateTenantReadingBy(
        { query: { tenantUserId: tenant.id }, options: {} },
        { subkWh: 42 }
      );

      expect(result.valid).toBe(true);
      expect(result.value[0].subkWh).toBe(42);
    });

    it("returns no data changed when values are identical", async () => {
      const { tenant, billing } = await seed();
      const {
        value: [added],
      } = await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id, subkWh: 10 }),
      ]);

      const result = await updateTenantReadingBy(
        { query: { id: added.id }, options: {} },
        { subkWh: 10 }
      );

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].subkWh).toBe(10);
    });

    it("returns valid false when nothing matches", async () => {
      const result = await updateTenantReadingBy(
        { query: { id: "missing" }, options: {} },
        { subkWh: 5 }
      );
      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
    });
  });

  describe("getTenantReadingCountBy", () => {
    it("counts matches and returns valid false for zero", async () => {
      const { owner, tenant, billing } = await seed();
      const {
        value: [tenant2],
      } = await addUser([createTenantUser(owner.id, { name: "Mia" })]);

      await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id }),
        createTenantReading({ tenantUserId: tenant2.id, billingInfoId: billing.id }),
      ]);

      const result = await getTenantReadingCountBy({ query: { billingInfoId: billing.id } });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);

      const none = await getTenantReadingCountBy({ query: { billingInfoId: "nope" } });
      expect(none.valid).toBe(false);
    });
  });

  describe("deleteTenantReadingBy", () => {
    it("deletes by id", async () => {
      const { tenant, billing } = await seed();
      const {
        value: [added],
      } = await addTenantReading([
        createTenantReading({ tenantUserId: tenant.id, billingInfoId: billing.id }),
      ]);

      const result = await deleteTenantReadingBy({ query: { id: added.id } });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);

      const check = await getTenantReadingBy({ query: { id: added.id }, options: {} });
      expect(check.valid).toBe(false);
    });

    it("returns valid false without conditions", async () => {
      const result = await deleteTenantReadingBy({ query: {} });
      expect(result.valid).toBe(false);
      expect(result.message).toBe("No conditions provided for deletion");
    });

    it("returns valid false when nothing matches", async () => {
      const result = await deleteTenantReadingBy({ query: { id: "missing" } });
      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
    });
  });
});
