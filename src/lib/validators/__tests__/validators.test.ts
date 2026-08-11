import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { billFormSchema, subMeterSchema, updateBillingInfoSchema } from "$/validators/billing-info";
import { importBillFormSchema, importSubMeterSchema } from "$/validators/import";
import {
  createTenantSchema,
  updateTenantSchema,
  submitReadingSchema,
  updateSubmissionSchema,
} from "$/validators/tenant";

describe("subMeterSchema", () => {
  it("accepts an eager entry with a reading", () => {
    const result = v.safeParse(subMeterSchema, {
      tenantUserId: "t1",
      reading: 100,
      status: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a pending entry without a reading", () => {
    const output = v.parse(subMeterSchema, { tenantUserId: "t1" });
    expect(output.reading).toBeUndefined();
  });

  it("rejects entries without a tenant", () => {
    const result = v.safeParse(subMeterSchema, { reading: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative readings", () => {
    const result = v.safeParse(subMeterSchema, { tenantUserId: "t1", reading: -5 });
    expect(result.success).toBe(false);
  });
});

describe("billFormSchema", () => {
  it("accepts a pending billing (all sub-meter readings omitted)", () => {
    const result = v.safeParse(billFormSchema, {
      date: "2026-09-01",
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ tenantUserId: "t1" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts eager billings with readings", () => {
    const result = v.safeParse(billFormSchema, {
      date: "2026-09-01",
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ tenantUserId: "t1", reading: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid totals", () => {
    const result = v.safeParse(billFormSchema, {
      date: "2026-09-01",
      totalkWh: 0,
      balance: -1,
      status: "pending",
      subMeters: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBillingInfoSchema", () => {
  it("requires the billing id and accepts omitted readings", () => {
    const result = v.safeParse(updateBillingInfoSchema, {
      id: "b1",
      date: "2026-09-01",
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ id: "r1", tenantUserId: "t1", reading: 100 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("import schemas", () => {
  it("imports label-based sub-meters with an optional status", () => {
    const result = v.safeParse(importSubMeterSchema, { label: "Lola", reading: 6767 });
    expect(result.success).toBe(true);

    const withStatus = v.safeParse(importSubMeterSchema, {
      label: "Lola",
      reading: 6767,
      status: "paid",
    });
    expect(withStatus.success).toBe(true);
  });

  it("validates a full import item", () => {
    const result = v.safeParse(importBillFormSchema, {
      date: "2026-08-04T00:00:00.000Z",
      totalkWh: 108,
      balance: 1414.31,
      status: "paid",
      subMeters: [{ label: "Lola", reading: 6767 }],
    });
    expect(result.success).toBe(true);
  });
});

describe("tenant schemas", () => {
  it("validates createTenantSchema", () => {
    expect(
      v.safeParse(createTenantSchema, { name: "Lola", email: "lola@x.com", password: "12345678" })
        .success
    ).toBe(true);
    expect(
      v.safeParse(createTenantSchema, { name: "L", email: "bad", password: "x" }).success
    ).toBe(false);
  });

  it("validates updateTenantSchema", () => {
    expect(v.safeParse(updateTenantSchema, { tenantUserId: "t1", name: "Lola" }).success).toBe(
      true
    );
    expect(v.safeParse(updateTenantSchema, { tenantUserId: "t1", name: "L" }).success).toBe(false);
  });

  it("validates submission schemas", () => {
    expect(v.safeParse(submitReadingSchema, { reading: 100 }).success).toBe(true);
    expect(v.safeParse(submitReadingSchema, { reading: 100, billingInfoId: "b1" }).success).toBe(
      true
    );
    expect(v.safeParse(submitReadingSchema, { reading: -1 }).success).toBe(false);
    expect(v.safeParse(updateSubmissionSchema, { reading: 100 }).success).toBe(true);
  });
});
