import type { billingInfo } from "$/server/db/schema/billing-info";
import type { Payment } from "$/server/db/schema/payment";
import type { SubMeterWithPayment } from "./sub-meter";

export type BillingInfo = typeof billingInfo.$inferSelect;
export type NewBillingInfo = typeof billingInfo.$inferInsert;

export type BillingInfoDTO = {
  id: string;
  date: Date;
  totalkWh: number;
  balance: number;
  payPerkWh: number;
  status: "Pending" | "Paid";
  subReadingLatest?: number;
};

export type BillingInfoTableView = Omit<BillingInfo, "date" | "createdAt" | "updatedAt"> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ExtendedBillingInfoTableView = Omit<
  ExtendedBillingInfo,
  "date" | "createdAt" | "updatedAt"
> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ExtendedBillingInfo = BillingInfo & {
  payment: Payment | null;
  subMeters: SubMeterWithPayment[];
};

export type BillingSummary = {
  current: number;
  invested: number;
  totalReturns: number;
  netReturns: number;
  oneDayReturns: number;
  averageDailyReturn: number;
  averageMonthlyReturn: number;
};
