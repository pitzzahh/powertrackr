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
      // First create a user to reference
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser({ email: "billing@example.com" });
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            totalkWh: 1000,
            balance: 500.75,
            status: "Pending",
            payPerkWh: 0.15,
            date: "2024-01-15",
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(userId);
      expect(result.value[0].totalkWh).toBe(1000);
      expect(result.value[0].balance).toBe(500.75);
      expect(result.value[0].status).toBe("Pending");
      expect(result.value[0].payPerkWh).toBe(0.15);
    });

    it("should successfully add multiple billing infos", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = createBillingInfos(3, { userId }).map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 billing info(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((billing) => billing.id)).toBe(true);
      expect(result.value.every((billing) => billing.userId === userId)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addBillingInfo([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 billing info(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle billing info with payment reference", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 100.5 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            paymentId,
            totalkWh: 800,
            balance: 400.25,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBe(paymentId);
    });

    it("should handle billing info with null payment", async () => {
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
          const { id: _, ...rest } = createBillingInfo({
            userId,
            paymentId: null,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBeNull();
    });

    it("should handle different status types", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        createBillingInfo({ userId, status: "Paid" }),
        createBillingInfo({ userId, status: "Pending" }),
        createBillingInfo({ userId, status: "N/A" }),
      ].map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[1].status).toBe("Pending");
      expect(result.value[2].status).toBe("N/A");
    });
  });

  describe("getBillingInfoBy", () => {
    it("should find billing info by ID", async () => {
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
          const { id: _, ...rest } = createBillingInfo({ userId, totalkWh: 1200 });
          return rest;
        })(),
      ];
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedBilling.id);
      expect(result.value[0].totalkWh).toBe(1200);
    });

    it("should find billing info by user ID", async () => {
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
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].userId).toBe(userId);
    });

    it("should find billing info by date", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const testDate = "2024-02-01";
      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId, date: testDate });
          return rest;
        })(),
      ];
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { date: testDate },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].date).toBe(testDate);
    });

    describe("Billing Info CRUD Integration (payments & sub-meters) - manual CRUD flow", () => {
      it("should create main and sub payments correctly with multiple sub-meters (manual CRUD flow)", async () => {
        const userData = [
          (() => {
            const { id: _, ...rest } = createUser();
            return rest;
          })(),
        ];
        const userResult = await addUser(userData);
        const userId = userResult.value[0].id;

        const date = "2024-04-01";
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
        const subPaymentIds: (string | null)[] = [];
        for (const amount of expectedSubAmounts) {
          if (amount > 0) {
            const p = await addPayment([{ amount, date: new Date().toISOString() }]);
            subPaymentIds.push(p.value[0].id);
          } else {
            subPaymentIds.push(null);
          }
        }

        // Create main payment
        const mainPayment = await addPayment([
          { amount: expectedMain, date: new Date().toISOString() },
        ]);
        const mainPaymentId = mainPayment.value[0].id;

        // Insert billing info referencing main payment id
        const billingData = [
          (() => {
            const { id: _, ...rest } = createBillingInfo({
              userId,
              date,
              totalkWh,
              balance,
              status: "Paid",
              payPerkWh: payPer,
              paymentId: mainPaymentId,
            });
            return rest;
          })(),
        ];
        const billingResult = await addBillingInfo(billingData);
        expect(billingResult.valid).toBe(true);
        const billingId = billingResult.value[0].id;

        // Insert sub meters
        const subMeterData = subMeters.map((s, idx) => ({
          billingInfoId: billingId,
          subkWh: s.subReadingLatest - s.subReadingOld,
          subReadingLatest: s.subReadingLatest,
          subReadingOld: s.subReadingOld,
          paymentId: subPaymentIds[idx],
        }));
        await addSubMeter(subMeterData);

        // Assertions
        const billing = (await getBillingInfoBy({ query: { id: billingId }, options: {} }))
          .value[0];
        expect(billing.paymentId).toBe(mainPaymentId);

        const mainPay = (await getPaymentBy({ query: { id: mainPaymentId }, options: {} }))
          .value[0];
        expect((mainPay as any).amount).toBeCloseTo(expectedMain, 2);

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
        const userData = [
          (() => {
            const { id: _, ...rest } = createUser();
            return rest;
          })(),
        ];
        const userResult = await addUser(userData);
        const userId = userResult.value[0].id;

        const date = "2024-04-15";
        const totalkWh = 1000;
        const balance = 250;

        const payPer = calculatePayPerKwh(balance, totalkWh);

        // No sub-meter payments; main payment equals full balance
        const mainPayment = await addPayment([{ amount: balance, date: new Date().toISOString() }]);
        const mainPaymentId = mainPayment.value[0].id;

        const billingData = [
          (() => {
            const { id: _, ...rest } = createBillingInfo({
              userId,
              date,
              totalkWh,
              balance,
              status: "Pending",
              payPerkWh: payPer,
              paymentId: mainPaymentId,
            });
            return rest;
          })(),
        ];
        const billingResult = await addBillingInfo(billingData);
        expect(billingResult.valid).toBe(true);
        const billingId = billingResult.value[0].id;

        const subs = await getSubMeterBy({ query: { billingInfoId: billingId }, options: {} });
        expect(subs.valid).toBe(false);
        expect(subs.value).toHaveLength(0);

        const mainPay = (await getPaymentBy({ query: { id: mainPaymentId }, options: {} }))
          .value[0];
        expect((mainPay as any).amount).toBeCloseTo(balance, 2);
      });

      it("should update sub-meter and corresponding payment via CRUDs", async () => {
        const userData = [
          (() => {
            const { id: _, ...rest } = createUser();
            return rest;
          })(),
        ];
        const userResult = await addUser(userData);
        const userId = userResult.value[0].id;

        const date = "2024-05-01";
        const totalkWh = 500;
        const balance = 200;

        const payPer = calculatePayPerKwh(balance, totalkWh);

        // create initial sub-payment and billing
        const initialSubKwh = 10;
        const initialAmount = Number((initialSubKwh * payPer).toFixed(2));
        const subPayment = await addPayment([
          { amount: initialAmount, date: new Date().toISOString() },
        ]);
        const subPaymentId = subPayment.value[0].id;

        const mainPayment = await addPayment([
          { amount: balance - initialAmount, date: new Date().toISOString() },
        ]);
        const mainPaymentId = mainPayment.value[0].id;

        const billingData = [
          (() => {
            const { id: _, ...rest } = createBillingInfo({
              userId,
              date,
              totalkWh,
              balance,
              status: "Paid",
              payPerkWh: payPer,
              paymentId: mainPaymentId,
            });
            return rest;
          })(),
        ];
        const billingResult = await addBillingInfo(billingData);
        const billingId = billingResult.value[0].id;

        // create sub meter referencing the sub payment
        const addSub = await addSubMeter([
          {
            billingInfoId: billingId,
            subkWh: initialSubKwh,
            subReadingLatest: 1500,
            subReadingOld: 1490,
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
          subReadingLatest: 1520,
          subReadingOld: 1500,
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        createBillingInfo({ userId, status: "Paid" }),
        createBillingInfo({ userId, status: "Pending" }),
      ].map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { status: "Paid" },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].status).toBe("Paid");
    });

    it("should find billing info by totalkWh", async () => {
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
          const { id: _, ...rest } = createBillingInfo({ userId, totalkWh: 1500 });
          return rest;
        })(),
      ];
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { totalkWh: 1500 },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].totalkWh).toBe(1500);
    });

    it("should find billing info by balance", async () => {
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
          const { id: _, ...rest } = createBillingInfo({ userId, balance: 750.25 });
          return rest;
        })(),
      ];
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { balance: 750.25 },
        options: {},
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].balance).toBe(750.25);
    });

    it("should return empty result when billing info not found", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = createBillingInfos(5, { userId }).map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getBillingInfoBy(searchParam);

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

      const billingData = createBillingInfos(5, { userId }).map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getBillingInfoBy(searchParam);

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
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId },
        options: { fields: ["id", "userId", "totalkWh"] as (keyof NewBillingInfo)[] },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0]).toHaveProperty("userId");
      expect(result.value[0]).toHaveProperty("totalkWh");
    });

    it("should exclude specified ID", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = createBillingInfos(3, { userId }).map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      const addResult = await addBillingInfo(billingData);
      const excludeId = addResult.value[1].id;

      const searchParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: { exclude_id: excludeId },
      };

      const result = await getBillingInfoBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value.every((billing) => billing.id !== excludeId)).toBe(true);
    });
  });

  describe("updateBillingInfoBy", () => {
    it("should successfully update billing info by ID", async () => {
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
          const { id: _, ...rest } = createBillingInfo({
            userId,
            totalkWh: 1000,
            balance: 500.0,
            status: "Pending",
          });
          return rest;
        })(),
      ];
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

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

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 billing info(s) updated");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].totalkWh).toBe(1200);
      expect(result.value[0].balance).toBe(600.0);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[0].payPerkWh).toBe(0.2);
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
          const { id: _, ...rest } = createBillingInfo({ userId, totalkWh: 1000 });
          return rest;
        })(),
      ];
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const updateData = { totalkWh: 1000 };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
    });

    it("should handle nonexistent billing info update", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment({ amount: 200.0 });
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({ userId, paymentId: null });
          return rest;
        })(),
      ];
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const updateData = { paymentId };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].paymentId).toBe(paymentId);
    });

    it("should update multiple fields at once", async () => {
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
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

      const updateParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const updateData = {
        totalkWh: 2000,
        balance: 1000.0,
        status: "Paid" as const,
        payPerkWh: 0.25,
        date: "2024-03-01",
      };
      const result = await updateBillingInfoBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].totalkWh).toBe(2000);
      expect(result.value[0].balance).toBe(1000.0);
      expect(result.value[0].status).toBe("Paid");
      expect(result.value[0].payPerkWh).toBe(0.25);
      expect(result.value[0].date).toBe("2024-03-01");
    });
  });

  describe("getBillingInfoCountBy", () => {
    it("should return correct count for existing billing infos", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = createBillingInfos(5, { userId }).map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      await addBillingInfo(billingData);

      const countParam: HelperParam<NewBillingInfo> = {
        query: {},
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Billing info(s) count is 5");
    });

    it("should return zero count when no billing infos match", async () => {
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const billingData = [
        createBillingInfo({ userId, status: "Paid" }),
        createBillingInfo({ userId, status: "Paid" }),
        createBillingInfo({ userId, status: "Pending" }),
      ].map((billing) => {
        const { id: _, ...rest } = billing;
        return rest;
      });
      await addBillingInfo(billingData);

      const countParam: HelperParam<NewBillingInfo> = {
        query: { status: "Paid" },
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });

    it("should apply limit when searching by specific fields", async () => {
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
      const addResult = await addBillingInfo(billingData);
      const addedBilling = addResult.value[0];

      const countParam: HelperParam<NewBillingInfo> = {
        query: { id: addedBilling.id },
        options: {},
      };

      const result = await getBillingInfoCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });
  });

  describe("getBillingInfos", () => {
    it("should return DTO format billing infos", async () => {
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
          const { id: _, ...rest } = createBillingInfo({
            userId,
            totalkWh: 1500,
            balance: 750.5,
            status: "Paid",
          });
          return rest;
        })(),
      ];
      await addBillingInfo(billingData);

      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId },
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
      expect(result[0].userId).toBe(userId);
      expect(result[0].totalkWh).toBe(1500);
      expect(result[0].balance).toBe(750.5);
      expect(result[0].status).toBe("Paid");
    });

    it("should return empty array when no billing infos found", async () => {
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

    it("should handle billing info with null values", async () => {
      const billingData = createBillingInfo({
        paymentId: null,
      });

      const result = await mapNewBillingInfo_to_DTO([billingData]);

      expect(result).toHaveLength(1);
      expect(result[0].paymentId).toBeNull();
    });

    it("should handle billing info with missing values", async () => {
      const billingData = {
        id: undefined,
        userId: undefined,
        date: undefined,
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
      expect(result[0].date).toBeUndefined();
      expect(result[0].totalkWh).toBe(0);
      expect(result[0].balance).toBe(0);
      expect(result[0].status).toBe("N/A");
      expect(result[0].payPerkWh).toBe(0);
      expect(result[0].paymentId).toBeNull();
      expect(result[0].createdAt).toBeUndefined();
      expect(result[0].updatedAt).toBeUndefined();
    });

    it("should handle empty array input", async () => {
      const result = await mapNewBillingInfo_to_DTO([]);

      expect(result).toHaveLength(0);
    });

    it("should handle multiple billing infos", async () => {
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
      const param: HelperParam<NewBillingInfo> = {
        query: { userId: "test-user-id" },
        options: {},
      };

      const conditions = generateBillingInfoQueryConditions(param);

      expect(conditions).toEqual({ userId: "test-user-id" });
    });

    it("should generate correct conditions for multiple fields", () => {
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
      const param: HelperParam<NewBillingInfo> = {
        query: {
          id: "test-id",
          userId: "test-user-id",
          date: "2024-01-15",
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
        date: "2024-01-15",
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const largeKWh = 999999999;
      const largeBalance = 999999999.99;
      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            totalkWh: largeKWh,
            balance: largeBalance,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].totalkWh).toBe(largeKWh);
      expect(result.value[0].balance).toBe(largeBalance);
    });

    it("should handle billing info with small decimal values", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const smallBalance = 0.01;
      const smallPayPerKwh = 0.001;
      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            balance: smallBalance,
            payPerkWh: smallPayPerKwh,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].balance).toBe(smallBalance);
      expect(result.value[0].payPerkWh).toBe(smallPayPerKwh);
    });

    it("should handle special date formats", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const isoDate = new Date().toISOString();
      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            date: isoDate,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].date).toBe(isoDate);
    });

    it("should handle simultaneous billing info operations", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const promises = Array.from({ length: 10 }, (_, i) => {
        const billingData = [
          (() => {
            const { id: _, ...rest } = createBillingInfo({
              userId,
              totalkWh: i * 100,
            });
            return rest;
          })(),
        ];
        return addBillingInfo(billingData);
      });

      const results = await Promise.all(promises);

      expect(results.every((result) => result.valid)).toBe(true);
      expect(results.every((result) => result.value.length === 1)).toBe(true);
    });

    it("should handle billing info with foreign key relationships", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const paymentData = [
        (() => {
          const { id: _, ...rest } = createPayment();
          return rest;
        })(),
      ];
      const paymentResult = await addPayment(paymentData);
      const paymentId = paymentResult.value[0].id;

      const billingData = [
        (() => {
          const { id: _, ...rest } = createBillingInfo({
            userId,
            paymentId,
          });
          return rest;
        })(),
      ];

      const result = await addBillingInfo(billingData);

      expect(result.valid).toBe(true);
      expect(result.value[0].userId).toBe(userId);
      expect(result.value[0].paymentId).toBe(paymentId);

      // Verify the relationship exists by querying
      const searchParam: HelperParam<NewBillingInfo> = {
        query: { userId, paymentId },
        options: {},
      };

      const searchResult = await getBillingInfoBy(searchParam);
      expect(searchResult.valid).toBe(true);
      expect(searchResult.value).toHaveLength(1);
    });
  });
});
