import type { tenantReading } from "$/server/db/schema";
import type { Payment } from "$/types/payment";
import type { Status } from "$/types/billing-info";

export type TenantReading = typeof tenantReading.$inferSelect;
export type NewTenantReading = typeof tenantReading.$inferInsert;

export type TenantReadingDTO = {
  id: string;
  tenantUserId: string;
  billingInfoId: string;
  tenantName: string;
  subkWh: number | null;
  reading: number | null;
  status: Status;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  payment?: Payment;
};

export type TenantReadingWithPayment = TenantReading & {
  payment?: Payment;
};
