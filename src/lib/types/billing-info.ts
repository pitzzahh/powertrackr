import type { billingInfo } from "$/server/db/schema/billing-info";
import type { Payment } from "$/server/db/schema/payment";
import type { SubMeterDTO, SubMeterWithPayment } from "./sub-meter";

export type BillingInfo = typeof billingInfo.$inferSelect;
export type NewBillingInfo = Omit<typeof billingInfo.$inferInsert, "createdAt" | "updatedAt">;

export type BillingInfoDTO = {
  id: string;
  userId: string;
  date: Date;
  totalkWh: number;
  balance: number;
  status: "Paid" | "Pending" | "N/A";
  payPerkWh: number;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingInfoDTOWithSubMeters = BillingInfoDTO & {
  subMeters: SubMeterDTO[];
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
