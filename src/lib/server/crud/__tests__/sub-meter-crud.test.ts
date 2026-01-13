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
      // Create a user and billing info to reference
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            subkWh: 77,
            subReadingLatest: 2000,
            subReadingOld: 1950,
          });
          return rest;
        })(),
      ];

      const result = await addSubMeter(subMeterData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 sub meter(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].billingInfoId).toBe(billingId);
      expect(result.value[0].subReadingLatest).toBe(2000);
    });

    it("should successfully add multiple sub meters", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMetersData = createSubMeters(3, { billingInfoId: billingId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      const result = await addSubMeter(subMetersData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 sub meter(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((s) => s.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addSubMeter([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 sub meter(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle sub meter with payment reference", async () => {
      // Create user and billing info
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      // Create payment
      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 123.45 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            paymentId,
            subkWh: 42,
          });
          return rest;
        })(),
      ];

      const result = await addSubMeter(subMeterData);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBe(paymentId);
    });

    it("should handle sub meter with null payment", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            paymentId: null,
          });
          return rest;
        })(),
      ];

      const result = await addSubMeter(subMeterData);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBeNull();
    });
  });

  describe("getSubMeterBy", () => {
    it("should find sub meter by ID", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            subReadingLatest: 1800,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: added.id },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(added.id);
    });

    it("should find sub meter by billingInfoId", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({ billingInfoId: billingId });
          return rest;
        })(),
      ];
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { billingInfoId: billingId },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value[0].billingInfoId).toBe(billingId);
    });

    it("should find sub meter by subReadingLatest", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const testLatest = 5555;
      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            subReadingLatest: testLatest,
          });
          return rest;
        })(),
      ];
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { subReadingLatest: testLatest },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value[0].subReadingLatest).toBe(testLatest);
    });

    it("should find sub meter by paymentId", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      // create payment
      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 5 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            paymentId,
          });
          return rest;
        })(),
      ];
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { paymentId },
        options: {},
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBe(paymentId);
    });

    it("should return empty result when sub meter not found", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = createSubMeters(5, { billingInfoId: billingId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = createSubMeters(5, { billingInfoId: billingId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMeterData);

      const searchParam: HelperParam<NewSubMeter> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const { id: _, ...subMeterDataWithoutId } = createSubMeter({
        billingInfoId: billingId,
        subkWh: 99,
      });
      await addSubMeter([subMeterDataWithoutId]);

      const searchParam: HelperParam<NewSubMeter> = {
        query: { billingInfoId: billingId },
        options: { fields: ["id", "billingInfoId", "subkWh"] as (keyof NewSubMeter)[] },
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("billingInfoId");
    });

    it("should include payment when with_payment option is true", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 12.34 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            paymentId,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: added.id },
        options: { with_payment: true },
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      const row = result.value[0] as Partial<NewSubMeter & { payment?: Payment | null }>;
      expect(row.payment).toBeDefined();
      expect(row.payment!.id).toBe(paymentId);
    });

    it("should include billing info when with_billing_info option is true", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId, totalkWh: 999 });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const searchParam: HelperParam<NewSubMeter> = {
        query: { id: added.id },
        options: { with_billing_info: true },
      };

      const result = await getSubMeterBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      const row = result.value[0] as Partial<NewSubMeter & { billingInfo?: BillingInfo }>;
      expect(row.billingInfo).toBeDefined();
      expect(row.billingInfo!.id).toBe(billingId);
    });
  });

  describe("updateSubMeterBy", () => {
    it("should successfully update sub meter by ID", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            subkWh: 20,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewSubMeter> = {
        query: { id: added.id },
        options: {},
      };

      const result = await updateSubMeterBy(updateParam, { subkWh: 888 });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 sub meter(s) updated");
      expect(result.value[0].subkWh).toBe(888);
    });

    it("should handle no data changed scenario", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            subkWh: 44,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewSubMeter> = {
        query: { id: added.id },
        options: {},
      };

      const result = await updateSubMeterBy(updateParam, { subkWh: 44 });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(added.id);
    });

    it("should handle nonexistent sub meter update", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMetersData = createSubMeters(5, { billingInfoId: billingId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSubMeter(subMetersData);

      const countParam: HelperParam<NewSubMeter> = {
        query: {},
        options: {},
      };

      const result = await getSubMeterCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Sub meter(s) count is 5");
    });

    it("should return zero count when no sub meters match", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMetersData = [
        createSubMeter({ billingInfoId: billingId, subkWh: 11 }),
        createSubMeter({ billingInfoId: billingId, subkWh: 11 }),
        createSubMeter({ billingInfoId: billingId, subkWh: 22 }),
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

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getSubMeters & mapNewSubMeter_to_DTO", () => {
    it("should return DTO format sub meters", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        createSubMeter({
          billingInfoId: billingId,
          subkWh: 333,
        }),
      ];
      await addSubMeter(subMeterData);

      const result = await getSubMeters({ query: {}, options: {} });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].billingInfoId).toBe(billingId);
      expect(result[0].subKwh).toBe(333);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should include payment in DTO when requested", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 77 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
            paymentId,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const result = await getSubMeters({
        query: { id: added.id },
        options: { with_payment: true },
      });

      expect(result).toHaveLength(1);
      const dto = result[0] as SubMeterDTOWithPayment;
      expect(dto.payment).toBeDefined();
      expect(dto.payment!.id).toBe(paymentId);
    });

    it("should include billing info in DTO when requested", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId, totalkWh: 2000 });
          return rest;
        })(),
      ];
      const billingResult = await addBillingInfo(billingData);
      const billingId = billingResult.value[0].id;

      const subMeterData = [
        (() => {
          const { id: _, ...rest } = createSubMeter({
            billingInfoId: billingId,
          });
          return rest;
        })(),
      ];
      const addResult = await addSubMeter(subMeterData);
      const added = addResult.value[0];

      const result = await getSubMeters({
        query: { id: added.id },
        options: { with_billing_info: true },
      });

      expect(result).toHaveLength(1);
      const dto = result[0] as SubMeterDTOWithBillingInfo;
      expect(dto.billingInfo).toBeDefined();
      expect(dto.billingInfo!.id).toBe(billingId);
    });

    it("mapNewSubMeter_to_DTO should handle null/undefined values", async () => {
      const data: Partial<NewSubMeter>[] = [
        {
          id: undefined,
          billingInfoId: undefined,
          subkWh: undefined,
          subReadingLatest: undefined,
          subReadingOld: undefined,
          paymentId: undefined,
        },
      ];

      const dto = await mapNewSubMeter_to_DTO(data);

      expect(dto).toHaveLength(1);
      expect(dto[0].id).toBeUndefined();
      expect(dto[0].billingInfoId).toBeUndefined();
      expect(dto[0].subKwh).toBeUndefined();
      expect(dto[0].createdAt).toBeUndefined();
      expect(dto[0].updatedAt).toBeUndefined();
    });
  });

  describe("generateSubMeterQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewSubMeter> = {
        query: { billingInfoId: "billing-1" } as unknown as NewSubMeter,
        options: {},
      };

      const conditions = generateSubMeterQueryConditions(param);

      expect(conditions.billingInfoId).toBe("billing-1");
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewSubMeter> = {
        query: {
          id: "sm-1",
          billingInfoId: "billing-1",
          subkWh: 10,
          subReadingLatest: 200,
          subReadingOld: 150,
          paymentId: "pay-1",
        } as unknown as NewSubMeter,
        options: {},
      };

      const conditions = generateSubMeterQueryConditions(param);

      expect(conditions.id).toBe("sm-1");
      expect(conditions.billingInfoId).toBe("billing-1");
      const typedConditions = conditions as {
        subkWh?: number;
        subReadingLatest?: number;
        subReadingOld?: number;
        paymentId?: string;
      };
      expect(typedConditions.subkWh).toBe(10);
      expect(typedConditions.subReadingLatest).toBe(200);
      expect(typedConditions.subReadingOld).toBe(150);
      expect(typedConditions.paymentId).toBe("pay-1");
    });

    it("should handle exclude_id option", () => {
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
