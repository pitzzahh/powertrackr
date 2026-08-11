import { STATUS_VALUES } from "$/types/billing-info";
import * as v from "valibot";

/**
 * Schema for a billing item in an import payload. Sub-meters are referenced
 * by label (the tenant's name), not by id — the server resolves them.
 */
export const importSubMeterSchema = v.object({
  label: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  status: v.fallback(v.picklist(STATUS_VALUES), "pending"),
  reading: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
});

export const importBillFormSchema = v.object({
  date: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  balance: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  totalkWh: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  subMeters: v.fallback(v.array(importSubMeterSchema), []),
  status: v.fallback(v.picklist(STATUS_VALUES), "pending"),
});
