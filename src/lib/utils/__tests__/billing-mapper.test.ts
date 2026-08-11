import { describe, it, expect } from "vitest";
import {
  billingInfoToDto,
  billingInfoToTableView,
  extendedBillingInfoToTableView,
} from "$/utils/mapper/billing-info";
import type { ExtendedBillingInfoTableView } from "$/types/billing-info";

const basePayment = {
  id: "p1",
  amount: 500,
  date: new Date("2024-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const baseSubMeter: ExtendedBillingInfoTableView["subMeters"][number] = {
  id: "r1",
  tenantUserId: "t1",
  billingInfoId: "b1",
  tenantName: "Lola",
  subkWh: 20,
  reading: 100,
  status: "paid",
  paymentId: "p2",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  payment: { ...basePayment, id: "p2", amount: 20 },
};

const baseRow: ExtendedBillingInfoTableView = {
  id: "b1",
  userId: "u1",
  date: new Date("2024-01-01T00:00:00.000Z"),
  totalkWh: 100,
  balance: 500,
  status: "paid",
  payPerkWh: 5,
  paymentId: "p1",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  payment: basePayment,
  subMeters: [baseSubMeter],
  dateFormatted: "Jan 1, 2024",
  createdAtFormatted: "Jan 1, 2024",
  updatedAtFormatted: "Jan 2, 2024",
};

describe("billingInfoToDto", () => {
  it("maps top-level billing fields into the DTO", () => {
    const dto = billingInfoToDto(baseRow);

    expect(dto.id).toBe("b1");
    expect(dto.userId).toBe("u1");
    expect(dto.date).toEqual(baseRow.date);
    expect(dto.totalkWh).toBe(100);
    expect(dto.balance).toBe(500);
    expect(dto.status).toBe("paid");
    expect(dto.payPerkWh).toBe(5);
    expect(dto.paymentId).toBe("p1");
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  it("maps sub-meters with tenant identity and strips the payment relation", () => {
    const dto = billingInfoToDto(baseRow);

    expect(dto.subMeters).toHaveLength(1);
    const sub = dto.subMeters[0];
    expect(sub.tenantUserId).toBe("t1");
    expect(sub.tenantName).toBe("Lola");
    expect(sub.reading).toBe(100);
    expect(sub.subkWh).toBe(20);
    expect(sub.status).toBe("paid");
    expect(sub).not.toHaveProperty("payment");
  });

  it("keeps a null reading on pending sub-meters", () => {
    const dto = billingInfoToDto({
      ...baseRow,
      subMeters: [{ ...baseSubMeter, reading: null, subkWh: null, paymentId: null }],
    });

    expect(dto.subMeters[0].reading).toBeNull();
    expect(dto.subMeters[0].subkWh).toBeNull();
    expect(dto.subMeters[0].paymentId).toBeNull();
  });
});

describe("billingInfoToTableView", () => {
  it("formats dates as strings", () => {
    const view = billingInfoToTableView({
      id: "b1",
      userId: "u1",
      date: new Date("2024-01-01T00:00:00.000Z"),
      totalkWh: 100,
      balance: 500,
      status: "paid",
      payPerkWh: 5,
      paymentId: "p1",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    expect(typeof view.date).toBe("string");
    expect(typeof view.createdAt).toBe("string");
    expect(typeof view.updatedAt).toBe("string");
    expect(view.paymentId).toBe("p1");
  });
});

describe("extendedBillingInfoToTableView", () => {
  it("adds formatted date fields and keeps sub-meters", () => {
    const view = extendedBillingInfoToTableView(baseRow);

    expect(typeof view.dateFormatted).toBe("string");
    expect(typeof view.createdAtFormatted).toBe("string");
    expect(typeof view.updatedAtFormatted).toBe("string");
    expect(view.subMeters).toHaveLength(1);
    expect(view.payment.amount).toBe(500);
  });
});
