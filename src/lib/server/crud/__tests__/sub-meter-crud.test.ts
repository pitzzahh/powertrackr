import { describe, it, expect, beforeEach } from "vitest";
import {
  addSubMeter,
  updateSubMeterBy,
  getSubMeterBy,
  getSubMeters,
  getSubMeterCountBy,
  mapNewSubMeter_to_DTO,
  generateSubMeterQueryConditions,
} from "../sub-meter-crud";
import {
  createSubMeter,
  createSubMeters,
  createPayment,
  createBillingInfo,
  createUser,
  resetSequence,
} from "./helpers/factories";
import { addUser } from "../user-crud";
import { addPayment } from "../payment-crud";
import { addBillingInfo } from "../billing-info-crud";
import type {
  NewSubMeter,
  Payment,
  BillingInfo,
  SubMeterDTOWithPayment,
  SubMeterDTOWithBillingInfo,
} from "$/types/sub-meter";
import type { HelperParam } from "$/types/helper";

describe("Sub Meter CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addSubMeter", () => {
    it("should successfully add a single sub meter", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          subkWh: 77,
          reading: 2000,
          label: "Test Sub Meter",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(addedSubMeter.billingInfoId).toBe(addedBilling.id);
      expect((addedSubMeter as any).reading).toBe(2000);
    });

    it("should successfully add multiple sub meters", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const subMetersData = createSubMeters(3, { billingInfoId: addedBilling.id }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      const result = await addSubMeter(subMetersData);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 sub meter(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((s) => s.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;

      const result = await addSubMeter([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 sub meter(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle sub meter with payment reference", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 123.45 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          paymentId: addedPayment.id,
          subkWh: 42,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validPayment).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(addedSubMeter.paymentId).toBe(addedPayment.id);
    });

    it("should handle sub meter with null payment", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          paymentId: null,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(addedSubMeter.paymentId).toBeNull();
    });
  });

  describe("getSubMeterBy", () => {
    it("should find sub meter by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          reading: 1800,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: addedSubMeter.id },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedSubMeter.id);
    });

    it("should find sub meter by billingInfoId", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([createSubMeter({ billingInfoId: addedBilling.id })]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { billingInfoId: addedBilling.id },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value[0].billingInfoId).toBe(addedBilling.id);
    });

    it("should find sub meter by subReadingLatest", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const testLatest = 5555;
      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          reading: testLatest,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { reading: testLatest },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect((result.value[0] as any).reading).toBe(testLatest);
    });

    it("should find sub meter by paymentId", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedBillingPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedBillingPayment.id,
        }),
      ]);

      const {
        valid: validSubPayment,
        value: [addedSubPayment],
      } = await addPayment([createPayment({ amount: 5 })]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          paymentId: addedSubPayment.id,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { paymentId: addedSubPayment.id },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubPayment).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubPayment).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBe(addedSubPayment.id);
    });

    it("should return empty result when sub meter not found", async () => {
      if (process.env.CI === "true") return;

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const subMeterData = createSubMeters(5, { billingInfoId: addedBilling.id }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const subMeterData = createSubMeters(5, { billingInfoId: addedBilling.id }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          subkWh: 99,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { billingInfoId: addedBilling.id },
        options: { fields: ["id", "billingInfoId", "subkWh"] as (keyof NewSubMeter)[] },
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("billingInfoId");
    });

    it("should include payment when with_payment option is true", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedBillingPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedBillingPayment.id,
        }),
      ]);

      const {
        valid: validSubPayment,
        value: [addedSubPayment],
      } = await addPayment([createPayment({ amount: 12.34 })]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          paymentId: addedSubPayment.id,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: addedSubMeter.id },
        options: { with_payment: true },
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubPayment).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubPayment).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      const row = result.value[0] as Partial<NewSubMeter & { payment?: Payment | null }>;
      expect(row.payment).toBeDefined();
      expect(row.payment!.id).toBe(addedSubPayment.id);
    });

    it("should include billing info when with_billing_info option is true", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 200 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 2000,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
        }),
      ]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: addedSubMeter.id },
        options: { with_billing_info: true },
      };

      const result = await getSubMeterBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      const row = result.value[0] as Partial<NewSubMeter & { billingInfo?: BillingInfo }>;
      expect(row.billingInfo).toBeDefined();
      expect(row.billingInfo!.id).toBe(addedBilling.id);
    });
  });

  describe("updateSubMeterBy", () => {
    it("should successfully update sub meter by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          subkWh: 20,
        }),
      ]);

      const updateParam: HelperParam<NewSubMeter> = {
        query: { id: addedSubMeter.id },
        options: {},
      };

      const result = await updateSubMeterBy(updateParam, { subkWh: 888 });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 sub meter(s) updated");
      expect(result.value[0].subkWh).toBe(888);
    });

    it("should handle no data changed scenario", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          subkWh: 44,
        }),
      ]);

      const updateParam: HelperParam<NewSubMeter> = {
        query: { id: addedSubMeter.id },
        options: {},
      };

      const result = await updateSubMeterBy(updateParam, { subkWh: 44 });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(addedSubMeter.id);
    });

    it("should handle nonexistent sub meter update", async () => {
      if (process.env.CI === "true") return;

      const updateParam: HelperParam<NewSubMeter> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await updateSubMeterBy(updateParam, { subkWh: 1 });

      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
      expect(result.message).toContain("id: nonexistent-id not found");
    });
  });

  describe("getSubMeterCountBy", () => {
    it("should return correct count for existing sub meters", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const subMetersData = createSubMeters(5, { billingInfoId: addedBilling.id }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMetersData);

      const countParam: HelperParam<NewSubMeter> = {
        query: {},
        options: {},
      };

      const result = await getSubMeterCountBy(countParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Sub meter(s) count is 5");
    });

    it("should return zero count when no sub meters match", async () => {
      if (process.env.CI === "true") return;

      const countParam: HelperParam<NewSubMeter> = {
        query: { id: "nope" },
        options: {},
      };

      const result = await getSubMeterCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("id: nope not found");
    });

    it("should count sub meters with specific criteria", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const subMetersData = [
        createSubMeter({ billingInfoId: addedBilling.id, subkWh: 11 }),
        createSubMeter({ billingInfoId: addedBilling.id, subkWh: 11 }),
        createSubMeter({ billingInfoId: addedBilling.id, subkWh: 22 }),
      ].map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      await addSubMeter(subMetersData);

      const countParam: HelperParam<NewSubMeter> = {
        query: { subkWh: 11 } as unknown as NewSubMeter, // query key uses subkWh in generate function
        options: {},
      };

      const result = await getSubMeterCountBy(countParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getSubMeters & mapNewSubMeter_to_DTO", () => {
    it("should return DTO format sub meters", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          subkWh: 333,
        }),
      ]);

      const result = await getSubMeters({ query: {}, options: {} });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].billingInfoId).toBe(addedBilling.id);
      expect(result[0].subKwh).toBe(333);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should include payment in DTO when requested", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedBillingPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedBillingPayment.id,
        }),
      ]);

      const {
        valid: validSubPayment,
        value: [addedSubPayment],
      } = await addPayment([createPayment({ amount: 77 })]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
          paymentId: addedSubPayment.id,
        }),
      ]);

      const result = await getSubMeters({
        query: { id: addedSubMeter.id },
        options: { with_payment: true },
      });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubPayment).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubPayment).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result).toHaveLength(1);
      const dto = result[0] as SubMeterDTOWithPayment;
      expect(dto.payment).toBeDefined();
      expect(dto.payment!.id).toBe(addedSubPayment.id);
    });

    it("should include billing info in DTO when requested", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 200 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 2000,
          paymentId: addedPayment.id,
        }),
      ]);

      const {
        valid: validSubMeter,
        value: [addedSubMeter],
      } = await addSubMeter([
        createSubMeter({
          billingInfoId: addedBilling.id,
        }),
      ]);

      const result = await getSubMeters({
        query: { id: addedSubMeter.id },
        options: { with_billing_info: true },
      });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(validSubMeter).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedSubMeter).toBeDefined();
      expect(result).toHaveLength(1);
      const dto = result[0] as SubMeterDTOWithBillingInfo;
      expect(dto.billingInfo).toBeDefined();
      expect(dto.billingInfo!.id).toBe(addedBilling.id);
    });

    it("mapNewSubMeter_to_DTO should handle null/undefined values", async () => {
      if (process.env.CI === "true") return;

      const data: Partial<NewSubMeter>[] = [
        {
          id: undefined,
          billingInfoId: undefined,
          subkWh: undefined,
          reading: undefined,
          paymentId: undefined,
        },
      ];

      const dto = await mapNewSubMeter_to_DTO(data);

      expect(dto).toHaveLength(1);
      expect(dto[0].id).toBeUndefined();
      expect(dto[0].billingInfoId).toBeUndefined();
      expect(dto[0].subKwh).toBeUndefined();
      expect(dto[0].createdAt).toBeNull();
      expect(dto[0].updatedAt).toBeNull();
    });
  });

  describe("generateSubMeterQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewSubMeter> = {
        query: { billingInfoId: "billing-1" } as unknown as NewSubMeter,
        options: {},
      };

      const conditions = generateSubMeterQueryConditions(param);

      expect(conditions.billingInfoId).toBe("billing-1");
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewSubMeter> = {
        query: {
          id: "sm-1",
          billingInfoId: "billing-1",
          subkWh: 10,
          reading: 200,
          paymentId: "pay-1",
        } as unknown as NewSubMeter,
        options: {},
      };

      const conditions = generateSubMeterQueryConditions(param);

      expect(conditions.id).toBe("sm-1");
      expect(conditions.billingInfoId).toBe("billing-1");
      const typedConditions = conditions as {
        subkWh?: number;
        reading?: number;
        paymentId?: string;
      };
      expect(typedConditions.subkWh).toBe(10);
      expect(typedConditions.reading).toBe(200);
      expect(typedConditions.paymentId).toBe("pay-1");
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewSubMeter> = {
        query: {} as unknown as NewSubMeter,
        options: { exclude_id: "exclude-sm" },
      };

      const conditions = generateSubMeterQueryConditions(param);

      const typedConditions = conditions as { NOT?: { id?: string } };
      expect(typedConditions.NOT).toBeDefined();
      expect(typedConditions.NOT!.id).toBe("exclude-sm");
    });

    it("should ignore undefined/null fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewSubMeter> = {
        query: {
          id: undefined as unknown as string,
          billingInfoId: undefined as unknown as string,
        } as unknown as NewSubMeter,
        options: {},
      };

      const conditions = generateSubMeterQueryConditions(param);

      expect(Object.keys(conditions)).toHaveLength(0);
    });
  });
});
