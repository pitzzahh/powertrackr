import * as v from "valibot";

// Schema for individual sub meter entry
export const subMeterSchema = v.object({
  label: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  reading: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
});

export const updateSubMeterSchema = v.intersect([subMeterSchema, v.object({ id: v.string() })]);

// Schema for billing info form with multiple sub meters
export const billFormSchema = v.object({
  date: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  balance: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  totalkWh: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  // Multiple sub meters instead of single subReading
  subMeters: v.fallback(v.array(subMeterSchema), []),
  status: v.fallback(v.picklist(["Paid", "Pending", "N/A"]), "Pending"),
});

// Schema for updating billing info with multiple sub meters
export const updateBillingInfoSchema = v.object({
  id: v.string(),
  date: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  balance: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  totalkWh: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  // Multiple sub meters instead of single subReading
  subMeters: v.fallback(v.array(updateSubMeterSchema), []),
  status: v.fallback(v.picklist(["Paid", "Pending", "N/A"]), "Pending"),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = v.object({ userId: v.string() });

export const getBillingInfoSchema = v.string();

export const deleteBillingInfoSchema = v.object({ id: v.string(), count: v.number() });

export const deleteBillingInfoSchemaBatch = v.object({
  ids: v.array(v.string()),
  count: v.number(),
});

export const generateRandomBillingInfosSchema = v.object({
  count: v.pipe(
    v.unknown(),
    v.transform((v) => Number(v)),
    v.number(),
    v.minValue(1, "must be at least 1")
  ),
  minSubMeters: v.pipe(
    v.unknown(),
    v.transform((v) => Number(v)),
    v.number(),
    v.minValue(0, "must be 0 or greater")
  ),
  maxSubMeters: v.pipe(
    v.unknown(),
    v.transform((v) => Number(v)),
    v.number(),
    v.minValue(0, "must be 0 or greater")
  ),
});
