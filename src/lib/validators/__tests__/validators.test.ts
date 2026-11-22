import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  BILL_FORM_SCHEMA,
  SUB_METER_SCHEMA,
  UPDATE_BILLING_INFO_SCHEMA,
} from "#lib/validators/billing-info.js";
import { IMPORT_BILL_FORM_SCHEMA, IMPORT_SUB_METER_SCHEMA } from "#lib/validators/import.js";
import { parsePlunkTemplates } from "#lib/validators/plunk.js";
import {
  CREATE_TENANT_SCHEMA,
  UPDATE_TENANT_SCHEMA,
  SUBMIT_READING_SCHEMA,
  UPDATE_SUBMISSION_SCHEMA,
} from "#lib/validators/tenant.js";

describe("SUB_METER_SCHEMA", () => {
  it("accepts an eager entry with a reading", () => {
    const result = v.safeParse(SUB_METER_SCHEMA, {
      tenantUserId: "t1",
      reading: 100,
      status: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a pending entry without a reading", () => {
    const output = v.parse(SUB_METER_SCHEMA, { tenantUserId: "t1" });
    expect(output.reading).toBeUndefined();
  });

  it("rejects entries without a tenant", () => {
    const result = v.safeParse(SUB_METER_SCHEMA, { reading: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative readings", () => {
    const result = v.safeParse(SUB_METER_SCHEMA, { tenantUserId: "t1", reading: -5 });
    expect(result.success).toBe(false);
  });
});

describe("BILL_FORM_SCHEMA", () => {
  it("accepts a pending billing (all sub-meter readings omitted)", () => {
    const result = v.safeParse(BILL_FORM_SCHEMA, {
      date: "2026-09-01",
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ tenantUserId: "t1" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts eager billings with readings", () => {
    const result = v.safeParse(BILL_FORM_SCHEMA, {
      date: "2026-09-01",
      totalkWh: 200,
      balance: 2000,
      status: "pending",
      subMeters: [{ tenantUserId: "t1", reading: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid totals", () => {
    const result = v.safeParse(BILL_FORM_SCHEMA, {
      date: "2026-09-01",
      totalkWh: 0,
      balance: -1,
      status: "pending",
      subMeters: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("UPDATE_BILLING_INFO_SCHEMA", () => {
  it("requires the billing id and accepts omitted readings", () => {
    const result = v.safeParse(UPDATE_BILLING_INFO_SCHEMA, {
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
    const result = v.safeParse(IMPORT_SUB_METER_SCHEMA, { label: "Lola", reading: 6767 });
    expect(result.success).toBe(true);

    const withStatus = v.safeParse(IMPORT_SUB_METER_SCHEMA, {
      label: "Lola",
      reading: 6767,
      status: "paid",
    });
    expect(withStatus.success).toBe(true);
  });

  it("validates a full import item", () => {
    const result = v.safeParse(IMPORT_BILL_FORM_SCHEMA, {
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
  it("validates CREATE_TENANT_SCHEMA", () => {
    expect(
      v.safeParse(CREATE_TENANT_SCHEMA, { name: "Lola", email: "lola@x.com", password: "12345678" })
        .success
    ).toBe(true);
    expect(
      v.safeParse(CREATE_TENANT_SCHEMA, { name: "L", email: "bad", password: "x" }).success
    ).toBe(false);
  });

  it("validates UPDATE_TENANT_SCHEMA", () => {
    expect(v.safeParse(UPDATE_TENANT_SCHEMA, { tenantUserId: "t1", name: "Lola" }).success).toBe(
      true
    );
    expect(v.safeParse(UPDATE_TENANT_SCHEMA, { tenantUserId: "t1", name: "L" }).success).toBe(
      false
    );
  });

  it("validates submission schemas", () => {
    expect(v.safeParse(SUBMIT_READING_SCHEMA, { reading: 100 }).success).toBe(true);
    expect(v.safeParse(SUBMIT_READING_SCHEMA, { reading: 100, billingInfoId: "b1" }).success).toBe(
      true
    );
    expect(v.safeParse(SUBMIT_READING_SCHEMA, { reading: -1 }).success).toBe(false);
    expect(v.safeParse(UPDATE_SUBMISSION_SCHEMA, { reading: 100 }).success).toBe(true);
  });
});

describe("parsePlunkTemplates", () => {
  const tpl = { id: "t1", name: "Email Verification" };
  it("accepts every list shape Plunk has returned", () => {
    for (const shape of [
      { success: true, data: { items: [tpl] } },
      { success: true, data: { data: [tpl] } },
      { data: [tpl] },
      [tpl],
    ]) {
      expect(parsePlunkTemplates(shape)).toEqual([tpl]);
    }
  });
  it("skips a malformed template instead of dropping the list", () => {
    expect(parsePlunkTemplates([tpl, { id: "t2", name: null }])).toEqual([tpl]);
  });
});
