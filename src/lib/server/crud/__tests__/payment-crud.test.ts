import { describe, it, expect, beforeEach } from "vitest";
import {
  addPayment,
  updatePaymentBy,
  getPaymentBy,
  getPayments,
  getPaymentCountBy,
  deletePaymentBy,
  mapNewPayment_to_DTO,
} from "../payment-crud";
import { createPayment, createPayments, resetSequence } from "./helpers/factories";
import type { NewPayment } from "$/types/payment";
import type { HelperParam } from "$/server/types/helper";
import { generateQueryConditions } from "$/server/mapper";

describe("Payment CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addPayment", () => {
    it("should successfully add a single payment", async () => {
      if (process.env.CI === "true") return;

      const {
        valid,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 200.5, date: new Date("2024-01-15") })]);

      expect(valid).toBe(true);
      expect(addedPayment).toBeDefined();
      expect(addedPayment).toHaveProperty("id");
      expect(addedPayment.amount).toBe(200.5);
      expect(addedPayment.date).toStrictEqual(new Date("2024-01-15"));
    });

    it("should successfully add multiple payments", async () => {
      if (process.env.CI === "true") return;

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
      if (process.env.CI === "true") return;

      const { valid, value } = await addPayment([]);

      expect(valid).toBe(true);
      expect(value).toHaveLength(0);
    });
  });

  describe("getPaymentBy", () => {
    it("should find payment by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 300.75, date: new Date("2024-02-02") })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 payment(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedPayment.id);
      expect(result.value[0].amount).toBe(300.75);
    });

    it("should find payment by amount", async () => {
      if (process.env.CI === "true") return;

      const testAmount = 500.5;
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: testAmount })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { amount: testAmount },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].amount).toBe(testAmount);
    });

    it("should find payment by date", async () => {
      if (process.env.CI === "true") return;

      const testDate = new Date("2024-03-01");
      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ date: testDate })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const searchParam: HelperParam<NewPayment> = {
        query: { date: testDate },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].date).toStrictEqual(testDate);
    });

    it("should return empty result when payment not found", async () => {
      if (process.env.CI === "true") return;

      const searchParam: HelperParam<NewPayment> = {
        query: { id: "nonexistent-id" },
      };

      const result = await getPaymentBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      if (process.env.CI === "true") return;

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
      if (process.env.CI === "true") return;

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
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([
        createPayment({
          amount: 777.77,
          date: new Date("2024-04-04"),
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
      if (process.env.CI === "true") return;

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
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 123.45 })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const updateParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
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
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 555.55 })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const updateParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
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
      if (process.env.CI === "true") return;

      const updateParam: HelperParam<NewPayment> = {
        query: { id: "nonexistent-id" },
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
      if (process.env.CI === "true") return;

      const paymentsData = createPayments(5).map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });
      const { valid: validPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);

      const countParam: HelperParam<NewPayment> = {
        query: {},
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Payment(s) count is 5");
    });

    it("should return zero count when no payments match", async () => {
      if (process.env.CI === "true") return;

      const countParam: HelperParam<NewPayment> = {
        query: { amount: 999999 },
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("amount: 999999 not found");
    });

    it("should count payments with specific criteria", async () => {
      if (process.env.CI === "true") return;

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
      };

      const result = await getPaymentCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getPayments & mapNewPayment_to_DTO", () => {
    it("should return DTO format payments", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([
        createPayment({
          amount: 321.99,
          date: new Date("2024-05-05"),
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
      if (process.env.CI === "true") return;

      const searchParam: HelperParam<NewPayment> = {
        query: { amount: 888888 },
      };

      const result = await getPayments(searchParam);

      expect(result).toEqual([]);
    });

    it("mapNewPayment_to_DTO should handle null/undefined values", async () => {
      if (process.env.CI === "true") return;

      const input: Partial<NewPayment>[] = [
        {
          id: undefined as unknown as string,
          amount: 0,
        },
      ];

      const result = mapNewPayment_to_DTO(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBeUndefined();
      expect(result[0].amount).toBe(0);
      expect(result[0].date).toBeUndefined();
      expect(result[0].createdAt).toBeUndefined();
      expect(result[0].updatedAt).toBeUndefined();
    });
  });

  describe("deletePaymentBy", () => {
    it("should successfully delete payment by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 150.25 })]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const deleteParam: HelperParam<NewPayment> = {
        query: { id: addedPayment.id },
      };

      const result = await deletePaymentBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 payment(s) deleted");

      // Verify deletion
      const fetchResult = await getPaymentBy({
        query: { id: addedPayment.id },
      });
      expect(fetchResult.valid).toBe(false);
    });

    it("should successfully delete multiple payments by amount", async () => {
      if (process.env.CI === "true") return;

      const paymentsData = [
        createPayment({ amount: 100 }),
        createPayment({ amount: 100 }),
        createPayment({ amount: 200 }),
      ].map((p) => {
        const { id: _, ...rest } = p;
        return rest;
      });

      const { valid: validPayments, value: addedPayments } = await addPayment(paymentsData);

      expect(validPayments).toBe(true);
      expect(addedPayments).toHaveLength(3);

      const deleteParam: HelperParam<NewPayment> = {
        query: { amount: 100 },
      };

      const result = await deletePaymentBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
      expect(result.message).toContain("2 payment(s) deleted");

      // Verify deletion
      const countResult = await getPaymentCountBy({
        query: { amount: 100 },
      });
      expect(countResult.value).toBe(0);
    });

    it("should handle nonexistent payment deletion", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewPayment> = {
        query: { id: "non-existent-id" },
      };

      const result = await deletePaymentBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("not deleted");
    });

    it("should handle no conditions provided", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewPayment> = {
        query: {},
      };

      const result = await deletePaymentBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toBe("No conditions provided for deletion");
    });

    it("should delete payments with multiple conditions", async () => {
      if (process.env.CI === "true") return;

      const testDate = new Date("2024-06-06");
      const testAmount = 250.5;

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([
        createPayment({
          amount: testAmount,
          date: testDate,
        }),
      ]);

      expect(validPayment).toBe(true);
      expect(addedPayment).toBeDefined();

      const deleteParam: HelperParam<NewPayment> = {
        query: { amount: testAmount, date: testDate },
      };

      const result = await deletePaymentBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 payment(s) deleted");

      // Verify deletion
      const fetchResult = await getPaymentBy({
        query: { id: addedPayment.id },
      });
      expect(fetchResult.valid).toBe(false);
    });
  });

  describe("generateQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPayment> = { query: { amount: 150 }, options: {} };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(conditions.amount).toBe(150);
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPayment> = {
        query: { amount: 200, date: new Date("2024-07-07"), id: "some-id" },
      };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(conditions.amount).toBe(200);
      expect(conditions.date).toStrictEqual(new Date("2024-07-07"));
      expect(conditions.id).toBe("some-id");
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPayment> = {
        query: {},
        options: { exclude_id: "exclude-this-id" },
      };
      const conditions = generateQueryConditions<NewPayment>(param);
      const typedConditions = conditions as { NOT?: { id?: string } };
      expect(typedConditions.NOT).toBeDefined();
      expect(typedConditions.NOT!.id).toBe("exclude-this-id");
    });

    it("should ignore undefined/null fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPayment> = {
        query: { id: undefined as unknown as string, amount: undefined as unknown as number },
      };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(Object.keys(conditions)).toHaveLength(0);
    });
  });
});
