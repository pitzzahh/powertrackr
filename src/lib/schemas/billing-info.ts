import * as v from "valibot";

// Schema for individual sub meter entry
export const subMeterSchema = v.object({
  reading: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
  subReadingLatest: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
  subReadingOld: v.optional(
    v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater"))
  ),
});

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
  status: v.fallback(v.picklist(["Paid", "Pending"]), "Pending"),
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
  subMeters: v.optional(v.array(subMeterSchema)),
  status: v.fallback(v.picklist(["Paid", "Pending"]), "Pending"),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = v.object({ userId: v.string() });

export const getBillingInfoSchema = v.string();

export const deleteBillingInfoSchema = v.object({ id: v.string() });
