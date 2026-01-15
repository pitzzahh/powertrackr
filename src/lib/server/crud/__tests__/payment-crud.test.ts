import { describe, it, expect, beforeEach } from "vitest";
import {
  addPayment,
  updatePaymentBy,
  getPaymentBy,
  getPayments,
  getPaymentCountBy,
  mapNewPayment_to_DTO,
  generatePaymentQueryConditions,
} from "../payment-crud";
import { createPayment, createPayments, resetSequence } from "./helpers/factories";
import type { NewPayment } from "$/types/payment";
import type { HelperParam } from "$/types/helper";

describe("Payment CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addPayment", () => {
    it("should successfully add a single payment", async () => {
      const {
        valid,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 200.5, date: "2024-01-15" })]);

      expect(valid).toBe(true);
      expect(addedPayment).toBeDefined();
      expect(addedPayment).toHaveProperty("id");
      expect(addedPayment.amount).toBe(200.5);
      expect(addedPayment.date).toBe("2024-01-15");
    });

    it("should successfully add multiple payments", async () => {
      const paymentsData = createPayments(3).map((payment) => {
        const { id: _, ...rest } = payment;
        return rest;
      });

      const { valid, value: addedPayments } = await addPayment(paymentsData);

      expect(valid).toBe(true);
      expect(addedPayments).toHaveLength(3);
      expect(addedPayments.every((p) => p.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const { valid, value } = await addPayment([]);

      expect(valid).toBe(true);
      expect(value).toHaveLength(0);
    });
  });

  describe("getPaymentBy", () => {
    it("should find payment by ID", async () => {
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 300.75, date: "2024-02-02" })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
        options: {},
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 payment(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedPayment.id);
      expect(result.value[0].amount).toBe(300.75);
    });

    it("should find payment by amount", async () => {
      const testAmount = 500.5;
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: testAmount })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { amount: testAmount },
        options: {},
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].amount).toBe(testAmount);
    });

    it("should find payment by date", async () => {
      const testDate = "2024-03-01";
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ date: testDate })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { date: testDate },
        options: {},
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].date).toBe(testDate);
    });

    it("should return empty result when payment not found", async () => {
      const searchParam: HelperParam<NewPayment> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      const paymentsData = createPayments(5).map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });
      const { valid: validPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);

      const searchParam: HelperParam<NewPayment> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      const paymentsData = createPayments(5).map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });
      const { valid: validPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);

      const searchParam: HelperParam<NewPayment> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([
        createPayment({
          amount: 777.77,
          date: "2024-04-04",
        }),
      ]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { amount: 777.77 },
        options: { fields: ["id", "amount"] as (keyof NewPayment)[] },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].amount).toBe(777.77);
      expect(result.value[0].id).toBeDefined();
    });

    it("should exclude specified ID", async () => {
      const payments = createPayments(2).map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });
      const { valid: validPayments, value: addedPayments } = await addPayment(payments);

      expect(validPayments).toBe(true);
      expect(addedPayments).toHaveLength(2);

      const excludedId = addedPayments[0].id;

      const searchParam: HelperParam<NewPayment> = {
        query: {},
        options: { exclude_id: excludedId },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value.every((p) => p.id !== excludedId)).toBe(true);
    });
  });

  describe("updatePaymentBy", () => {
    it("should successfully update payment by ID", async () => {
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 123.45 })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const updateParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
        options: {},
      };

      const updateData: Partial<NewPayment> = {
        amount: 999.99,
      };

      const result = await updatePaymentBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 payment(s) updated");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedPayment.id);
      expect(result.value[0].amount).toBe(999.99);
    });

    it("should handle no data changed scenario", async () => {
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 555.55 })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const updateParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
        options: {},
      };

      const updateData: Partial<NewPayment> = {
        amount: 555.55,
      };

      const result = await updatePaymentBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedPayment.id);
    });

    it("should handle nonexistent payment update", async () => {
      const updateParam: HelperParam<NewPayment> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const updateData: Partial<NewPayment> = {
        amount: 1,
      };

      const result = await updatePaymentBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
      expect(result.message).toContain("id: nonexistent-id not found");
    });
  });

  describe("getPaymentCountBy", () => {
    it("should return correct count for existing payments", async () => {
      const paymentsData = createPayments(5).map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });
      const { valid: validPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);

      const countParam: HelperParam<NewPayment> = {
        query: {},
        options: {},
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Payment(s) count is 5");
    });

    it("should return zero count when no payments match", async () => {
      const countParam: HelperParam<NewPayment> = {
        query: { amount: 999999 },
        options: {},
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("amount: 999999 not found");
    });

    it("should count payments with specific criteria", async () => {
      const paymentsData = [
        createPayment({ amount: 10 }),
        createPayment({ amount: 10 }),
        createPayment({ amount: 20 }),
      ].map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });

      const { valid: validPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);

      const countParam: HelperParam<NewPayment> = {
        query: { amount: 10 },
        options: {},
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getPayments & mapNewPayment_to_DTO", () => {
    it("should return DTO format payments", async () => {
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([
        createPayment({
          amount: 321.99,
          date: "2024-05-05",
        }),
      ]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const result = await getPayments({
        query: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].amount).toBe(321.99);
      expect(result[0].date).toStrictEqual(new Date(addedPayment.date!));
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should return empty array when no payments found", async () => {
      const searchParam: HelperParam<NewPayment> = {
        query: { amount: 888888 },
        options: {},
      };

      const result = await getPayments(searchParam);

      expect(result).toEqual([]);
    });

    it("mapNewPayment_to_DTO should handle null/undefined values", async () => {
      const input: Partial<NewPayment>[] = [
        {
          id: undefined as unknown as string,
          amount: null,
        },
      ];

      const result = mapNewPayment_to_DTO(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("");
      expect(result[0].amount).toBeNull();
      expect(result[0].date).toBeNull();
      expect(result[0].createdAt).toBeNull();
      expect(result[0].updatedAt).toBeNull();
    });
  });

  describe("generatePaymentQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewPayment> = { query: { amount: 150 }, options: {} };
      const conditions = generatePaymentQueryConditions(param);
      expect(conditions.amount).toBe(150);
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewPayment> = {
        query: { amount: 200, date: "2024-07-07", id: "some-id" },
        options: {},
      };
      const conditions = generatePaymentQueryConditions(param);
      expect(conditions.amount).toBe(200);
      expect(conditions.date).toBe("2024-07-07");
      expect(conditions.id).toBe("some-id");
    });

    it("should handle exclude_id option", () => {
      const param: HelperParam<NewPayment> = {
        query: {},
        options: { exclude_id: "exclude-this-id" },
      };
      const conditions = generatePaymentQueryConditions(param);
      const typedConditions = conditions as { NOT?: { id?: string } };
      expect(typedConditions.NOT).toBeDefined();
      expect(typedConditions.NOT!.id).toBe("exclude-this-id");
    });

    it("should ignore undefined/null fields", () => {
      const param: HelperParam<NewPayment> = {
        query: { id: undefined as unknown as string, amount: undefined as unknown as number },
        options: {},
      };
      const conditions = generatePaymentQueryConditions(param);
      expect(Object.keys(conditions)).toHaveLength(0);
    });
  });
});
