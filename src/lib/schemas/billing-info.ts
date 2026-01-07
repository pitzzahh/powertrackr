import { z } from "zod";

export const billFormSchema = z.object({
  date: z.string().refine((v) => v, { message: "is required" }),
  balance: z.number({ message: "must be a number" }).gt(0, { message: "must be greater than 0" }),
  totalKwh: z.number({ message: "must be a number" }).gt(0, { message: "must be greater than 0" }),
  subReadings: z
    .array(z.number({ message: "must be a number" }).gt(0, { message: "must be greater than 0" }))
    .optional(),
  status: z.enum(["Paid", "Pending"]).default("Pending"),
});

export const updateBillingInfoSchema = billFormSchema.extend({
  id: z.string(),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = z.object({ userId: z.string() });

export const getBillingInfoSchema = z.string();

export const deleteBillingInfoSchema = z.object({ id: z.string() });
