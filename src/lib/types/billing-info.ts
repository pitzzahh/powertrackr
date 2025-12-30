import type { billingInfo } from "$/server/db/schema/billing-info";
import type { Payment } from "$/server/db/schema/payment";

export type BillingInfo = typeof billingInfo.$inferSelect;
export type NewBillingInfo = typeof billingInfo.$inferInsert;

export type BillingInfoDTO = {
  id: string;
  date: Date;
  totalKwh: number;
  subKwh: number;
  payPerKwh: number;
  subReadingOld: number;
  subReadingLatest: number;
  balance: number;
  payment: number;
  subPayment: number;
  status: "pending" | "paid";
};

export type BillingInfoTableView = Omit<BillingInfo, "date"> & { date: string };

export type ExtendedBillingInfo = BillingInfo & {
  payment: Payment | null;
  subPayment: Payment | null;
};
