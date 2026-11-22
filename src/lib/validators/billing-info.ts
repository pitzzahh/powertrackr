import * as v from "valibot";
import {
  DATE_STRING_FIELD,
  ID_FIELD,
  POSITIVE_NUMBER_FIELD,
  READING_FIELD,
  STATUS_WITH_DEFAULT_FIELD,
} from "./shared.js";

// A sub-meter entry in a billing form. Sub-meters ARE tenants: the entry
// references the tenant user id directly (the tenant's name is its label).
export const SUB_METER_SCHEMA = v.object({
  tenantUserId: ID_FIELD,
  status: STATUS_WITH_DEFAULT_FIELD,
  // Absent = the tenant has not submitted yet (pending billing). Forms cannot
  // transmit null, so pending entries simply omit the field.
  reading: v.optional(READING_FIELD),
});

export const UPDATE_SUB_METER_SCHEMA = v.object({
  ...SUB_METER_SCHEMA.entries,
  // tenant_reading id; absent for a sub-meter added during the edit.
  id: v.optional(ID_FIELD),
});

const BILL_FIELDS = {
  date: DATE_STRING_FIELD,
  balance: POSITIVE_NUMBER_FIELD,
  totalkWh: POSITIVE_NUMBER_FIELD,
  status: STATUS_WITH_DEFAULT_FIELD,
};

export const BILL_FORM_SCHEMA = v.object({
  ...BILL_FIELDS,
  subMeters: v.fallback(v.array(SUB_METER_SCHEMA), []),
});

export const UPDATE_BILLING_INFO_SCHEMA = v.object({
  ...BILL_FIELDS,
  id: ID_FIELD,
  subMeters: v.fallback(v.array(UPDATE_SUB_METER_SCHEMA), []),
});

export const DELETE_BILLING_INFO_SCHEMA = v.object({ id: ID_FIELD, count: v.number() });

export const DELETE_BILLING_INFO_BATCH_SCHEMA = v.object({
  ids: v.array(ID_FIELD),
  count: v.number(),
});

export const FINALIZE_BILLING_SCHEMA = v.object({ billingInfoId: ID_FIELD });

export function isBillFormValid(data: unknown): boolean {
  return v.safeParse(BILL_FORM_SCHEMA, data).success;
}
