import { z } from "zod";

export const billFormSchema = z.object({
  date: z.string().refine((v) => v, { message: "Date is required" }),
  balance: z.number().gt(0, { message: "Balance must be greater than 0" }),
  totalKwh: z.number().gt(0, { message: "Total Kwh must be greater than 0" }),
  subReading: z
    .number()
    .gt(0, { message: "Sub Reading must be greater than 0" })
    .optional(),
  status: z.enum(["Paid", "Pending"]),
});

export const updateBillingInfoSchema = billFormSchema.extend({
  id: z.string(),
});

export const billingInfoSchema = updateBillingInfoSchema;

export const getBillingInfosSchema = z.object({ userId: z.string() });

export const getBillingInfoSchema = z.string();

export const deleteBillingInfoSchema = z.object({ id: z.string() });
