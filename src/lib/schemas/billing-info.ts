import * as v from "valibot";

export const billFormSchema = v.object({
  date: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  balance: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  totalKWh: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  subReading: v.optional(
    v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0"))
  ),
  status: v.fallback(v.picklist(["Paid", "Pending"]), "Pending"),
});

export const updateBillingInfoSchema = v.object({
  id: v.string(),
  date: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  balance: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  totalKWh: v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0")),
  subReading: v.optional(
    v.pipe(v.number("must be a number"), v.minValue(1, "must be greater than 0"))
  ),
  status: v.fallback(v.picklist(["Paid", "Pending"]), "Pending"),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = v.object({ userId: v.string() });

export const getBillingInfoSchema = v.string();

export const deleteBillingInfoSchema = v.object({ id: v.string() });
