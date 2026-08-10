import { describe, it, expect } from "vitest";
import {
  createBillingInfoLogic,
  getBillingInfoBy,
  updateBillingInfoLogic,
} from "../billing-info-crud";
import { createUser } from "./helpers/factories";
import { addUser } from "../user-crud";
import { getPaymentBy, getPaymentCountBy } from "../payment-crud";
import { getSubMeterBy } from "../sub-meter-crud";

describe("updateBillingInfoLogic", () => {
  it("recomputes subkWh against the previous period's reading, not the record's own reading", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    // Period A: baseline period for sub meter "Kitchen" (reading 100, 0 usage)
    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 100, status: "pending" }],
      },
      userId
    );

    // Period B: usage = 250 - 100 = 150 at rate 1200/1200 = 1.0
    const billingB = await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const {
      value: [subB],
    } = await getSubMeterBy({ query: { billingInfoId: billingB.id }, options: {} });
    expect(subB.subkWh).toBe(150);

    // Edit the LATEST record's reading to 300 -> usage must be 300 - 100 (previous period A) = 200,
    // not 300 - 250 (the record's own stored reading) = 50.
    await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "paid",
        subMeters: [{ id: subB.id!, label: "Kitchen", reading: 300, status: "paid" }],
      },
      userId
    );

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });

    const updatedSub = updatedBilling.subMeters?.[0];
    expect(updatedSub?.reading).toBe(300);
    expect(updatedSub?.subkWh).toBe(200);
    expect(updatedSub?.payment?.amount).toBeCloseTo(200, 2);
    expect(updatedBilling.payment?.amount).toBeCloseTo(1200 - 200, 2);
  });

  it("keeps baseline meters un-billed when updating the oldest record (no previous period)", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    const billingA = await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 100, status: "pending" }],
      },
      userId
    );

    const {
      value: [subA],
    } = await getSubMeterBy({ query: { billingInfoId: billingA.id }, options: {} });
    expect(subA.subkWh).toBe(0);

    await updateBillingInfoLogic(
      {
        id: billingA.id,
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ id: subA.id!, label: "Kitchen", reading: 150, status: "pending" }],
      },
      userId
    );

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingA.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });

    const updatedSub = updatedBilling.subMeters?.[0];
    expect(updatedSub?.reading).toBe(150);
    expect(updatedSub?.subkWh).toBe(0);
    expect(updatedSub?.payment?.amount ?? 0).toBe(0);
    expect(updatedBilling.payment?.amount).toBeCloseTo(1000, 2);
  });

  it("persists the recomputed payPerKwh when balance or totalkWh changes", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 100, status: "pending" }],
      },
      userId
    );

    const billingB = await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const {
      value: [subB],
    } = await getSubMeterBy({ query: { billingInfoId: billingB.id }, options: {} });

    // New rate: 600 / 1200 = 0.5; usage stays 300 - 100 = 200 => sub payment 100, main 600 - 100 = 500
    await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 600,
        status: "paid",
        subMeters: [{ id: subB.id!, label: "Kitchen", reading: 300, status: "paid" }],
      },
      userId
    );

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });

    expect(updatedBilling.payPerkWh).toBeCloseTo(0.5, 4);
    expect(updatedBilling.balance).toBe(600);
    expect(updatedBilling.subMeters?.[0]?.payment?.amount).toBeCloseTo(100, 2);
    expect(updatedBilling.payment?.amount).toBeCloseTo(500, 2);
  });

  it("leaves sub meters and payments untouched for a no-op update", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 100, status: "pending" }],
      },
      userId
    );

    const billingB = await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const {
      value: [subB],
    } = await getSubMeterBy({ query: { billingInfoId: billingB.id }, options: {} });
    const paymentCountBefore = (await getPaymentCountBy({ query: {} })).value;

    await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ id: subB.id!, label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });

    expect(updatedBilling.subMeters).toHaveLength(1);
    expect(updatedBilling.subMeters?.[0]?.subkWh).toBe(150);
    expect(updatedBilling.subMeters?.[0]?.payment?.amount).toBeCloseTo(150, 2);
    expect(updatedBilling.payment?.amount).toBeCloseTo(1200 - 150, 2);
    expect((await getPaymentCountBy({ query: {} })).value).toBe(paymentCountBefore);
  });

  it("deletes the linked payment row when a sub meter is removed (no orphans)", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [
          { label: "Kitchen", reading: 100, status: "pending" },
          { label: "Garage", reading: 200, status: "pending" },
        ],
      },
      userId
    );

    const billingB = await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [
          { label: "Kitchen", reading: 250, status: "pending" },
          { label: "Garage", reading: 400, status: "pending" },
        ],
      },
      userId
    );

    const { value: subs } = await getSubMeterBy({
      query: { billingInfoId: billingB.id },
      options: {},
    });
    const kitchen = subs.find((s) => s.label === "Kitchen")!;
    const garage = subs.find((s) => s.label === "Garage")!;
    const garagePaymentId = garage.paymentId!;

    // Remove Garage from the billing period
    await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ id: kitchen.id!, label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const { valid: validRemaining, value: remainingSubs } = await getSubMeterBy({
      query: { billingInfoId: billingB.id },
      options: {},
    });
    expect(validRemaining).toBe(true);
    expect(remainingSubs).toHaveLength(1);
    expect(remainingSubs[0].label).toBe("Kitchen");

    // The removed sub meter's payment row must be gone
    const garagePayment = await getPaymentBy({ query: { id: garagePaymentId }, options: {} });
    expect(garagePayment.valid).toBe(false);

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true },
    });
    // Main payment = 1200 - (250 - 100) = 1050
    expect(updatedBilling.payment?.amount).toBeCloseTo(1050, 2);
  });

  it("adds a new sub meter mid-edit as an un-billed baseline while existing meters use the previous period", async () => {
    const {
      value: [addedUser],
    } = await addUser([createUser()]);
    const userId = addedUser.id;

    await createBillingInfoLogic(
      {
        date: "2024-01-01",
        totalkWh: 1000,
        balance: 1000,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 100, status: "pending" }],
      },
      userId
    );

    const billingB = await createBillingInfoLogic(
      {
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [{ label: "Kitchen", reading: 250, status: "pending" }],
      },
      userId
    );

    const {
      value: [subB],
    } = await getSubMeterBy({ query: { billingInfoId: billingB.id }, options: {} });

    await updateBillingInfoLogic(
      {
        id: billingB.id,
        date: "2024-02-01",
        totalkWh: 1200,
        balance: 1200,
        status: "pending",
        subMeters: [
          { id: subB.id!, label: "Kitchen", reading: 300, status: "pending" },
          { label: "Garage", reading: 500, status: "pending" },
        ],
      },
      userId
    );

    const {
      value: [updatedBilling],
    } = await getBillingInfoBy({
      query: { id: billingB.id },
      options: { with_payment: true, with_sub_meters_with_payment: true },
    });

    const kitchen = updatedBilling.subMeters?.find((s) => s.label === "Kitchen");
    const garage = updatedBilling.subMeters?.find((s) => s.label === "Garage");

    expect(kitchen?.subkWh).toBe(200);
    expect(kitchen?.payment?.amount).toBeCloseTo(200, 2);
    expect(garage?.reading).toBe(500);
    expect(garage?.subkWh).toBe(0);
    expect(garage?.payment?.amount ?? 0).toBe(0);
    expect(updatedBilling.payment?.amount).toBeCloseTo(1200 - 200, 2);
  });
});
