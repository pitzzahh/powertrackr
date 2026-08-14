import type { tenantReading } from "#lib/server/db/schema/index.js";
import type { Payment } from "#lib/types/payment.js";
import type { Status } from "#lib/types/billing-info.js";

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
