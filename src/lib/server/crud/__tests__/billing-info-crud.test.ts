import { describe, it, expect, beforeEach } from "vitest";
import {
  addBillingInfo,
  updateBillingInfoBy,
  getBillingInfoBy,
  getBillingInfos,
  getBillingInfoCountBy,
  mapNewBillingInfo_to_DTO,
  generateBillingInfoQueryConditions,
} from "../billing-info-crud";
import {
  createBillingInfo,
  createBillingInfos,
  createUser,
  createPayment,
  resetSequence,
} from "./helpers/factories";
import { calculatePayPerKwh } from "$lib";
import { addUser } from "../user-crud";
import { addPayment, getPaymentBy, updatePaymentBy } from "../payment-crud";
import { addSubMeter, getSubMeterBy, updateSubMeterBy } from "../sub-meter-crud";
import type { NewBillingInfo } from "$/types/billing-info";
import type { HelperParam } from "$/types/helper";
import type { Payment } from "$/types/payment";
import type { SubMeter } from "$/types/sub-meter";

describe("Billing Info CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addBillingInfo", () => {
    it("should successfully add a single billing info", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ email: "billing@example.com" })]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 500.75 })]);

      const result = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 1000,
          balance: 500.75,
          status: "Pending",
          payPerkWh: 0.15,
          date: new Date("2024-01-15"),
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(addedUser.id);
      expect(result.value[0].totalkWh).toBe(1000);
      expect(result.value[0].balance).toBe(500.75);
      expect(result.value[0].status).toBe("Pending");
      expect(result.value[0].payPerkWh).toBe(0.15);
      expect(result.value[0].paymentId).toBe(addedPayment.id);
    });

    it("should successfully add multiple billing infos", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 3 }, async () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = paymentResults.map((res) =>
        createBillingInfo({
          userId: addedUser.id,
          paymentId: res.value[0].id,
        })
      );

      const result = await addBillingInfo(billingData);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((res) => res.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 billing info(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((billing) => billing.id)).toBe(true);
      expect(result.value.every((billing) => billing.userId === addedUser.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;
      const result = await addBillingInfo([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 billing info(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle billing info with payment reference", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100.5 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
          totalkWh: 800,
          balance: 400.25,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validPayment).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedBilling.paymentId).toBe(addedPayment.id);
    });

    it("should require paymentId and accept a valid payment reference", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      // create a payment first to reference it (paymentId is required)
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

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(validBilling).toBe(true);
      expect(addedBilling.paymentId).toBe(addedPayment.id);
    });

    it("should handle different status types", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 3 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = [
        createBillingInfo({
          userId: addedUser.id,
          status: "Paid",
          paymentId: paymentResults[0].value[0].id,
        }),
        createBillingInfo({
          userId: addedUser.id,
          status: "Pending",
          paymentId: paymentResults[1].value[0].id,
        }),
        createBillingInfo({
          userId: addedUser.id,
          status: "N/A",
          paymentId: paymentResults[2].value[0].id,
        }),
      ];

      const result = await addBillingInfo(billingData);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[1].status).toBe("Pending");
      expect(result.value[2].status).toBe("N/A");
    });
  });

  describe("getBillingInfoBy", () => {
    it("should find billing info by ID", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 1200 * 0.1 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 1200,
          paymentId: addedPayment.id,
        }),
      ]);

      const result = await getBillingInfoBy({
        query: { id: addedBilling.id },
      });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedBilling.id);
      expect(result.value[0].totalkWh).toBe(1200);
    });

    it("should find billing info by user ID", async () => {
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

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId: addedUser.id },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].userId).toBe(addedUser.id);
    });

    it("should find billing info by date", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const testDate = new Date("2024-02-01");

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          date: testDate,
          paymentId: addedPayment.id,
        }),
      ]);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { date: testDate },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].date).toStrictEqual(testDate);
    });

    describe("Billing Info CRUD Integration (payments & sub-meters) - manual CRUD flow", () => {
      it("should create main and sub payments correctly with multiple sub-meters (manual CRUD flow)", async () => {
        if (process.env.CI === "true") return;
        const {
          valid: validUser,
          value: [addedUser],
        } = await addUser([createUser()]);

        const date = new Date("2024-04-01");
        const totalkWh = 1000;
        const balance = 1000;

        const subMeters = [
          { subReadingLatest: 1100, subReadingOld: 1000 },
          { subReadingLatest: 2050, subReadingOld: 2000 },
        ];

        const payPer = calculatePayPerKwh(balance, totalkWh);

        const expectedSubAmounts = subMeters.map((s) => {
          const subkWh = s.subReadingLatest - s.subReadingOld;
          return Number((subkWh * payPer).toFixed(2));
        });

        const totalSub = expectedSubAmounts.reduce((acc, x) => acc + x, 0);
        const expectedMain = Number((balance - totalSub).toFixed(2));

        // Create payments for sub meters
        const subPaymentIds: string[] = [];
        for (const amount of expectedSubAmounts) {
          const {
            value: [addedSubPayment],
          } = await addPayment([{ amount, date: new Date() }]);
          subPaymentIds.push(addedSubPayment.id);
        }

        // Create main payment
        const {
          value: [addedMainPayment],
        } = await addPayment([{ amount: expectedMain, date: new Date() }]);
        const mainPaymentId = addedMainPayment.id;

        // Insert billing info referencing main payment id
        const {
          valid: validBilling,
          value: [addedBilling],
        } = await addBillingInfo([
          createBillingInfo({
            userId: addedUser.id,
            date,
            totalkWh,
            balance,
            status: "Paid",
            payPerkWh: payPer,
            paymentId: mainPaymentId,
          }),
        ]);
        expect(validUser).toBe(true);
        expect(validBilling).toBe(true);
        const billingId = addedBilling.id;

        // Insert sub meters
        const subMeterData = subMeters.map((s, idx) => ({
          billingInfoId: billingId,
          subkWh: s.subReadingLatest - s.subReadingOld,
          label: `Sub-${idx + 1}`,
          reading: s.subReadingLatest,
          paymentId: subPaymentIds[idx],
        }));
        await addSubMeter(subMeterData);

        // Assertions
        expect(addedUser).toBeDefined();
        expect(addedBilling).toBeDefined();
        expect(addedMainPayment).toBeDefined();
        const billing = (await getBillingInfoBy({ query: { id: billingId }, options: {} }))
          .value[0];
        expect(billing.paymentId).toBe(mainPaymentId);

        const mainPay = (await getPaymentBy({ query: { id: mainPaymentId }, options: {} }))
          .value[0];
        expect(mainPay.amount).toBeCloseTo(expectedMain, 2);

        const subs = await getSubMeterBy({
          query: { billingInfoId: billingId },
          options: { with_payment: true },
        });
        expect(subs.valid).toBe(true);
        expect(subs.value).toHaveLength(subMeters.length);

        for (let i = 0; i < subs.value.length; i++) {
          const s = subs.value[i] as Partial<SubMeter> & {
            payment: Record<keyof Payment, unknown>;
          };
          if (expectedSubAmounts[i] > 0) {
            expect(s.payment.amount).toBeCloseTo(expectedSubAmounts[i], 2);
          } else {
            expect(s.payment).toBeNull();
          }
        }
      });

      it("should create main payment equal to balance when zero sub-meters (manual CRUD flow)", async () => {
        if (process.env.CI === "true") return;
        const {
          valid: validUser,
          value: [addedUser],
        } = await addUser([createUser()]);

        const date = new Date("2024-04-15");
        const totalkWh = 1000;
        const balance = 250;

        const payPer = calculatePayPerKwh(balance, totalkWh);

        // No sub-meter payments; main payment equals full balance
        const {
          value: [addedMainPayment],
        } = await addPayment([{ amount: balance, date: new Date() }]);
        const mainPaymentId = addedMainPayment.id;

        const {
          valid: validBilling,
          value: [addedBilling],
        } = await addBillingInfo([
          createBillingInfo({
            userId: addedUser.id,
            date,
            totalkWh,
            balance,
            status: "Pending",
            payPerkWh: payPer,
            paymentId: mainPaymentId,
          }),
        ]);
        expect(validUser).toBe(true);
        expect(validBilling).toBe(true);
        const billingId = addedBilling.id;

        expect(addedUser).toBeDefined();
        expect(addedBilling).toBeDefined();
        expect(addedMainPayment).toBeDefined();

        const subs = await getSubMeterBy({ query: { billingInfoId: billingId }, options: {} });
        expect(subs.valid).toBe(false);
        expect(subs.value).toHaveLength(0);

        const mainPay = (await getPaymentBy({ query: { id: mainPaymentId }, options: {} }))
          .value[0];
        expect(mainPay.amount).toBeCloseTo(balance, 2);
      });

      it("should update sub-meter and corresponding payment via CRUDs", async () => {
        if (process.env.CI === "true") return;
        const {
          valid: validUser,
          value: [addedUser],
        } = await addUser([createUser()]);

        const date = new Date("2024-05-01");
        const totalkWh = 500;
        const balance = 200;

        const payPer = calculatePayPerKwh(balance, totalkWh);

        // create initial sub-payment and billing
        const initialSubKwh = 10;
        const initialAmount = Number((initialSubKwh * payPer).toFixed(2));
        const {
          value: [addedSubPayment],
        } = await addPayment([{ amount: initialAmount, date: new Date() }]);
        const subPaymentId = addedSubPayment.id;

        const {
          value: [addedMainPayment],
        } = await addPayment([{ amount: balance - initialAmount, date: new Date() }]);
        const mainPaymentId = addedMainPayment.id;

        const {
          valid: validBilling,
          value: [addedBilling],
        } = await addBillingInfo([
          createBillingInfo({
            userId: addedUser.id,
            date,
            totalkWh,
            balance,
            status: "Paid",
            payPerkWh: payPer,
            paymentId: mainPaymentId,
          }),
        ]);
        const billingId = addedBilling.id;

        expect(validUser).toBe(true);
        expect(validBilling).toBe(true);
        expect(addedUser).toBeDefined();
        expect(addedBilling).toBeDefined();
        expect(addedSubPayment).toBeDefined();
        expect(addedMainPayment).toBeDefined();

        // create sub meter referencing the sub payment
        const addSub = await addSubMeter([
          {
            billingInfoId: billingId,
            subkWh: initialSubKwh,
            label: "Initial Sub",
            reading: 1500,
            paymentId: subPaymentId,
          },
        ]);
        expect(addSub.valid).toBe(true);
        const subId = addSub.value[0].id;

        // Now update the sub-meter's readings -> new kwh and payment
        const newSubKwh = 20;
        const newAmount = Number((newSubKwh * payPer).toFixed(2));

        const updateSubParam = {
          query: { id: subId },
          options: {},
        };
        const updatedSub = await updateSubMeterBy(updateSubParam, {
          subkWh: newSubKwh,
          reading: 1520,
        });
        expect(updatedSub.valid).toBe(true);
        expect(updatedSub.value[0].subkWh).toBe(newSubKwh);

        // Update associated payment accordingly
        const updatedPayment = await updatePaymentBy(
          { query: { id: subPaymentId }, options: {} },
          { amount: newAmount }
        );
        expect(updatedPayment.valid).toBe(true);
        expect((updatedPayment.value[0] as any).amount).toBeCloseTo(newAmount, 2);

        // Fetch sub with payment and verify
        const fetched = await getSubMeterBy({
          query: { id: subId },
          options: { with_payment: true },
        });
        expect(fetched.valid).toBe(true);
        const fetchedSub = fetched.value[0] as any;
        expect(fetchedSub.subkWh).toBe(newSubKwh);
        expect((fetchedSub.payment as any).amount).toBeCloseTo(newAmount, 2);
      });
    });

    it("should find billing info by status", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 2 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = [
        createBillingInfo({
          userId: addedUser.id,
          status: "Paid",
          paymentId: paymentResults[0].value[0].id,
        }),
        createBillingInfo({
          userId: addedUser.id,
          status: "Pending",
          paymentId: paymentResults[1].value[0].id,
        }),
      ];
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { status: "Paid" },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].status).toBe("Paid");
    });

    it("should find billing info by totalkWh", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 150 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 1500,
          paymentId: addedPayment.id,
        }),
      ]);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { totalkWh: 1500 },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].totalkWh).toBe(1500);
    });

    it("should find billing info by balance", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 750.25 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          balance: 750.25,
          paymentId: addedPayment.id,
        }),
      ]);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { balance: 750.25 },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].balance).toBe(750.25);
    });

    it("should return empty result when billing info not found", async () => {
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewBillingInfo> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

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

      const paymentPromises = Array.from({ length: 5 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = createBillingInfos(5, { userId: addedUser.id }).map((b, i) => ({
        ...b,
        paymentId: paymentResults[i].value[0].id,
      }));
      await addBillingInfo(
        billingData.map((b) => {
          const { id: _, ...rest } = b;
          return rest;
        })
      );

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 5 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = createBillingInfos(5, { userId: addedUser.id }).map((b, i) => ({
        ...b,
        paymentId: paymentResults[i].value[0].id,
      }));
      await addBillingInfo(
        billingData.map((b) => {
          const { id: _, ...rest } = b;
          return rest;
        })
      );

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
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

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId: addedUser.id },
        options: { fields: ["id", "userId", "totalkWh"] as (keyof NewBillingInfo)[] },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0]).toHaveProperty("userId");
      expect(result.value[0]).toHaveProperty("totalkWh");
    });

    it("should exclude specified ID", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 3 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const addResult = await addBillingInfo(
        createBillingInfos(3, { userId: addedUser.id }).map((b, i) => ({
          ...b,
          paymentId: paymentResults[i].value[0].id,
        }))
      );
      const excludeId = addResult.value[1].id;

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { exclude_id: excludeId },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value.every((billing) => billing.id !== excludeId)).toBe(true);
    });
  });

  describe("updateBillingInfoBy", () => {
    it("should successfully update billing info by ID", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 500 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 1000,
          balance: 500.0,
          status: "Pending",
          paymentId: addedPayment.id,
        }),
      ]);

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const updateData = {
        totalkWh: 1200,
        balance: 600.0,
        status: "Paid" as const,
        payPerkWh: 0.2,
      };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) updated");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].totalkWh).toBe(1200);
      expect(result.value[0].balance).toBe(600.0);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[0].payPerkWh).toBe(0.2);
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
          totalkWh: 1000,
          paymentId: addedPayment.id,
        }),
      ]);

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const updateData = { totalkWh: 1000 };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
    });

    it("should handle nonexistent billing info update", async () => {
      if (process.env.CI === "true") return;
      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const updateData = { totalkWh: 1500 };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should update payment reference", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 200.0 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({ userId: addedUser.id, paymentId: addedPayment.id }),
      ]);
      expect(addedBilling.status).toBe("Pending");

      const { valid: validUpdateBilling, value: updatedBilling } = await updateBillingInfoBy(
        {
          query: { id: addedBilling.id },
        },
        {
          status: "Paid",
        }
      );
      expect(validUser).toBe(true);
      expect(validPayment).toBe(true);
      expect(validBilling).toBe(true);
      expect(validUpdateBilling).toBe(true);

      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(updatedBilling).toBeDefined();
    });

    it("should update multiple fields at once", async () => {
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

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const result = await updateBillingInfoBy(updateParam, {
        totalkWh: 2000,
        balance: 1000.0,
        status: "Paid" as const,
        payPerkWh: 0.25,
        date: new Date("2024-03-01"),
      });

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value[0].totalkWh).toBe(2000);
      expect(result.value[0].balance).toBe(1000.0);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[0].payPerkWh).toBe(0.25);
      expect(result.value[0].date).toStrictEqual(new Date("2024-03-01"));
    });
  });

  describe("getBillingInfoCountBy", () => {
    it("should return correct count for existing billing infos", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentResults = await Promise.all(
        Array.from({ length: 5 }, () => addPayment([createPayment({ amount: 100 })]))
      );

      await addBillingInfo(
        createBillingInfos(5, { userId: addedUser.id })
          .map((b, i) => ({
            ...b,
            paymentId: paymentResults[i].value[0].id,
          }))
          .map((b) => {
            const { id: _, ...rest } = b;
            return rest;
          })
      );

      const countParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Billing info(s) count is 5");
    });

    it("should return zero count when no billing infos match", async () => {
      if (process.env.CI === "true") return;
      const countParam: HelperParam<NewBillingInfo> = {
        query: { userId: "nonexistent-user-id" },
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("userId: nonexistent-user-id not found");
    });

    it("should count billing infos with specific criteria", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const paymentPromises = Array.from({ length: 3 }, () =>
        addPayment([createPayment({ amount: 100 })])
      );
      const paymentResults = await Promise.all(paymentPromises);

      const billingData = [
        createBillingInfo({
          userId: addedUser.id,
          status: "Paid",
          paymentId: paymentResults[0].value[0].id,
        }),
        createBillingInfo({
          userId: addedUser.id,
          status: "Paid",
          paymentId: paymentResults[1].value[0].id,
        }),
        createBillingInfo({
          userId: addedUser.id,
          status: "Pending",
          paymentId: paymentResults[2].value[0].id,
        }),
      ];
      await addBillingInfo(billingData);

      const countParam: HelperParam<NewBillingInfo> = {
        query: { status: "Paid" },
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(paymentResults.every((r) => r.valid)).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });

    it("should apply limit when searching by specific fields", async () => {
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

      const countParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });
  });

  describe("getBillingInfos", () => {
    it("should return DTO format billing infos", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 750.5 })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: 1500,
          balance: 750.5,
          status: "Paid",
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId: addedUser.id },
        options: {},
      };

      const result = await getBillingInfos(searchParam);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("totalkWh");
      expect(result[0]).toHaveProperty("balance");
      expect(result[0]).toHaveProperty("status");
      expect(result[0]).toHaveProperty("payPerkWh");
      expect(result[0]).toHaveProperty("paymentId");
      expect(result[0]).toHaveProperty("createdAt");
      expect(result[0]).toHaveProperty("updatedAt");
      expect(result[0].userId).toBe(addedUser.id);
      expect(result[0].totalkWh).toBe(1500);
      expect(result[0].balance).toBe(750.5);
      expect(result[0].status).toBe("Paid");
    });

    it("should return empty array when no billing infos found", async () => {
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId: "nonexistent-user-id" },
        options: {},
      };

      const result = await getBillingInfos(searchParam);

      expect(result).toHaveLength(0);
    });
  });

  describe("mapNewBillingInfo_to_DTO", () => {
    it("should correctly map billing info data to DTO format", async () => {
      if (process.env.CI === "true") return;
      const billingData = createBillingInfo({
        userId: "test-user-id",
        totalkWh: 1800,
        balance: 900.25,
        status: "Pending",
        payPerkWh: 0.18,
        paymentId: "test-payment-id",
      });

      const result = await mapNewBillingInfo_to_DTO([billingData]);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("test-user-id");
      expect(result[0].totalkWh).toBe(1800);
      expect(result[0].balance).toBe(900.25);
      expect(result[0].status).toBe("Pending");
      expect(result[0].payPerkWh).toBe(0.18);
      expect(result[0].paymentId).toBe("test-payment-id");
    });

    it("should handle billing info with undefined values", async () => {
      if (process.env.CI === "true") return;
      const billingData = createBillingInfo({
        paymentId: undefined,
      });

      const result = await mapNewBillingInfo_to_DTO([billingData]);

      expect(result).toHaveLength(1);
      expect(result[0].paymentId).toBeNull();
    });

    it("should handle billing info with missing values", async () => {
      if (process.env.CI === "true") return;
      const billingData = {
        id: undefined,
        userId: undefined,
        totalkWh: undefined,
        balance: undefined,
        status: undefined,
        payPerkWh: undefined,
        paymentId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const result = await mapNewBillingInfo_to_DTO([billingData]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("");
      expect(result[0].userId).toBe("");
      expect(result[0].date).toBeInstanceOf(Date); // We create new date if not present
      expect(result[0].totalkWh).toBe(0);
      expect(result[0].balance).toBe(0);
      expect(result[0].status).toBe("N/A");
      expect(result[0].payPerkWh).toBe(0);
      expect(result[0].paymentId).toBeNull();
      expect(result[0].createdAt).toBeInstanceOf(Date); // We create new date if not present
      expect(result[0].updatedAt).toBeInstanceOf(Date); // We create new date if not present
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;
      const result = await mapNewBillingInfo_to_DTO([]);

      expect(result).toHaveLength(0);
    });

    it("should handle multiple billing infos", async () => {
      if (process.env.CI === "true") return;
      const billingData = [
        createBillingInfo({ status: "Paid", totalkWh: 1000 }),
        createBillingInfo({ status: "Pending", totalkWh: 1500 }),
        createBillingInfo({ status: "N/A", totalkWh: 2000 }),
      ];

      const result = await mapNewBillingInfo_to_DTO(billingData);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe("Paid");
      expect(result[1].status).toBe("Pending");
      expect(result[2].status).toBe("N/A");
      expect(result[0].totalkWh).toBe(1000);
      expect(result[1].totalkWh).toBe(1500);
      expect(result[2].totalkWh).toBe(2000);
    });
  });

  describe("generateBillingInfoQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: { userId: "test-user-id" },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({ userId: "test-user-id" });
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: {
          userId: "test-user-id",
          status: "Paid",
          totalkWh: 1000,
        },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        status: "Paid",
        totalkWh: 1000,
      });
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: { userId: "test-user-id" },
        options: { exclude_id: "exclude-this-id" },
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        NOT: { id: "exclude-this-id" },
      });
    });

    it("should handle numeric fields with zero values", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: {
          totalkWh: 0,
          balance: 0,
          payPerkWh: 0,
        },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({
        totalkWh: 0,
        balance: 0,
        payPerkWh: 0,
      });
    });

    it("should ignore undefined fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: {
          userId: "test-user-id",
          totalkWh: undefined,
          balance: undefined,
          status: undefined,
        },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
      });
    });

    it("should handle all available query fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewBillingInfo> = {
        query: {
          id: "test-id",
          userId: "test-user-id",
          date: new Date("2024-01-15"),
          totalkWh: 1000,
          balance: 500.75,
          status: "Paid",
          payPerkWh: 0.15,
          paymentId: "test-payment-id",
        },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({
        id: "test-id",
        userId: "test-user-id",
        date: new Date("2024-01-15"),
        totalkWh: 1000,
        balance: 500.75,
        status: "Paid",
        payPerkWh: 0.15,
        paymentId: "test-payment-id",
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle billing info with very large numbers", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const largeKWh = 999999999;
      const largeBalance = 999999999.99;

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: largeBalance })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          totalkWh: largeKWh,
          balance: largeBalance,
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedBilling.totalkWh).toBe(largeKWh);
      // balance may be returned as a numeric string for very large values; coerce for comparison
      // Allow a slightly looser tolerance for very large numbers (float rounding)
      expect(Number(addedBilling.balance)).toBeCloseTo(largeBalance, 1);
    });

    it("should handle billing info with small decimal values", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const smallBalance = 0.01;
      const smallPayPerKwh = 0.001;

      const {
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: smallBalance })]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          balance: smallBalance,
          payPerkWh: smallPayPerKwh,
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedBilling.balance).toBe(smallBalance);
      expect(addedBilling.payPerkWh).toBe(smallPayPerKwh);
    });

    it("should handle special date formats", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const date = new Date();

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment({ amount: 100.5 })]);

      const {
        valid: validBillingInfo,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          date: date,
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validPayment).toBe(true);
      expect(validBillingInfo).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedBilling.date).toStrictEqual(date);
    });

    it("should handle simultaneous billing info operations", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const promises = Array.from({ length: 10 }, async (_, index) => {
        const {
          value: [addedPayment],
        } = await addPayment([createPayment({ amount: 100.5 * index })]);

        return addBillingInfo([
          createBillingInfo({
            userId: addedUser.id,
            totalkWh: index * 100,
            paymentId: addedPayment.id,
          }),
        ]);
      });

      const results = await Promise.all(promises);
      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();
      expect(results.every((result) => result.valid)).toBe(true);
      expect(results.every((result) => result.value.length === 1)).toBe(true);
    });

    it("should handle billing info with foreign key relationships", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      const {
        valid: validPayment,
        value: [addedPayment],
      } = await addPayment([createPayment()]);

      const {
        valid: validBilling,
        value: [addedBilling],
      } = await addBillingInfo([
        createBillingInfo({
          userId: addedUser.id,
          paymentId: addedPayment.id,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(validPayment).toBe(true);
      expect(validBilling).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedPayment).toBeDefined();
      expect(addedBilling).toBeDefined();
      expect(addedBilling.userId).toBe(addedUser.id);
      expect(addedBilling.paymentId).toBe(addedPayment.id);

      // Verify the relationship exists by querying
      const searchResult = await getBillingInfoBy({
        query: { userId: addedUser.id, paymentId: addedPayment.id },
        options: {},
      });
      expect(searchResult.valid).toBe(true);
      expect(searchResult.value).toHaveLength(1);
    });
  });
});
