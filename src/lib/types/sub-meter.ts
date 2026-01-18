import type { subMeter, payment, billingInfo } from "$/server/db/schema";

export type Payment = typeof payment.$inferSelect;
export type BillingInfo = typeof billingInfo.$inferSelect;

export type SubMeter = typeof subMeter.$inferSelect;
export type NewSubMeter = typeof subMeter.$inferInsert;

export type SubMeterDTO = {
  id: string;
  billingInfoId: string;
  subKwh: number | null;
  reading: number | null;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubMeterTableView = Omit<SubMeter, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SubMeterWithPayment = SubMeter & {
  payment: Payment | null;
};

export type SubMeterWithBillingInfo = SubMeter & {
  billingInfo: BillingInfo;
};

export type SubMeterDTOWithPayment = SubMeterDTO & {
  payment: Payment | null;
};

export type SubMeterDTOWithBillingInfo = SubMeterDTO & {
  billingInfo: BillingInfo;
};
