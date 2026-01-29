import type { billingInfo } from "$/server/db/schema/billing-info";
import type { Payment } from "$/server/db/schema/payment";
import type { SubMeterDTO, SubMeterWithPayment } from "$/types/sub-meter";

export type BillingInfo = typeof billingInfo.$inferSelect;
export type NewBillingInfo = Omit<typeof billingInfo.$inferInsert, "createdAt" | "updatedAt">;

export type BillingInfoWithPaymentAndSubMetersWithPayment = BillingInfo & {
  payment?: Payment;
  subMeters?: SubMeterWithPayment[];
};

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
  payment: Payment;
  subMeters: SubMeterWithPayment[];
};

export type BillingSummary = {
  current: number;
  invested: number;
  totalReturns: number;
  netReturns: number;
  oneDayReturns: number;
  // Period-to-period change in total payments (previous_totalPayment - latest_totalPayment).
  // Positive means payments decreased compared to the previous period (i.e. saved money).
  periodPaymentChange: number;
  // Percent change relative to the previous period (e.g. 12.5 === 12.5%).
  periodPaymentChangePct: number;
  averageDailyReturn: number;
  averageMonthlyReturn: number;
};

export type BillingCreateForm = {
  date: string;
  totalkWh: number;
  balance: number;
  status: string;
  subMeters: { label: string; reading: number }[];
};
