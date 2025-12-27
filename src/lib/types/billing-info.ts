import type { BillingInfo } from "$/server/db/schema/billing-info";
import type { Payment } from "$/server/db/schema/payment";

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

export type ExtendedBillingInfo = BillingInfo & {
  payment: Payment | null;
  subPayment: Payment | null;
};
