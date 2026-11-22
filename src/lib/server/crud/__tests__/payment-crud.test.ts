import { addPayment } from "./helpers/seed";
import { describe, it, expect, beforeEach } from "vitest";
import { getPaymentBy } from "../payment-crud";
import { createPayment, createPayments, resetSequence } from "./helpers/factories";
import type { NewPayment } from "#lib/types/payment.js";
import type { HelperParam } from "#lib/types/helper.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

describe("Payment CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("getPaymentBy", () => {
    it("should find payment by ID", async () => {
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
      const searchParam: HelperParam<NewPayment> = {
        query: { id: "nonexistent-id" },
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

  describe("generateQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewPayment> = { query: { amount: 150 }, options: {} };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(conditions.amount).toBe(150);
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewPayment> = {
        query: { amount: 200, date: new Date("2024-07-07"), id: "some-id" },
      };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(conditions.amount).toBe(200);
      expect(conditions.date).toStrictEqual(new Date("2024-07-07"));
      expect(conditions.id).toBe("some-id");
    });

    it("should handle exclude_id option", () => {
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
      const param: HelperParam<NewPayment> = {
        query: { id: undefined as unknown as string, amount: undefined as unknown as number },
      };
      const conditions = generateQueryConditions<NewPayment>(param);
      expect(Object.keys(conditions)).toHaveLength(0);
    });
  });
});
