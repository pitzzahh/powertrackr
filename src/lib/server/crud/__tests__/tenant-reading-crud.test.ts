import { addBillingInfo, addPayment, addTenantReading } from "./helpers/seed";
import { describe, it, expect, beforeEach } from "vitest";
import { getTenantReadingBy } from "../tenant-reading-crud";
import {
  createUser,
  createTenantUser,
  createTenantReading,
  resetSequence,
} from "./helpers/factories";
import { addUser } from "../user-crud";
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
});
