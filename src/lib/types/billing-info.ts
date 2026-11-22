import type { User } from "#lib/types/user.js";
import type { Infer } from "#lib/validators/shared.js";
import type { Payment } from "#lib/types/payment.js";
import type {
  BILL_FORM_SCHEMA,
  UPDATE_BILLING_INFO_SCHEMA,
  UPDATE_SUB_METER_SCHEMA,
} from "#lib/validators/billing-info.js";
import type {
  BILLING_INFO_INSERT_SCHEMA,
  BILLING_INFO_SELECT_SCHEMA,
  TENANT_READING_INSERT_SCHEMA,
  TENANT_READING_SELECT_SCHEMA,
} from "#lib/validators/entities.js";
import type { STATUS_FIELD } from "#lib/validators/shared.js";

export type BillingSubMeterForm = Infer<typeof UPDATE_SUB_METER_SCHEMA>;

export type BillingCreateForm = Infer<typeof BILL_FORM_SCHEMA>;

export type BillingUpdateForm = Infer<typeof UPDATE_BILLING_INFO_SCHEMA>;

// A tenant reading as returned with its billing: joined tenant name, typed
// status and (once materialized) its payment.
export type TenantReadingDTO = Omit<TenantReading, "status"> & {
  tenantName: string;
  status: Status;
  payment?: Payment;
};

export type BillingInfoWithSubMeters = BillingInfo & { subMeters: TenantReadingDTO[] };

export type BillingInfoWithPaymentAndSubMetersWithPayment = BillingInfo & {
  payment?: Payment;
  subMeters?: TenantReadingDTO[];
};

export type ExtendedBillingInfo = BillingInfo & {
  // null until the billing is finalized (pending billings await tenant readings)
  payment: Payment | null;
  subMeters: TenantReadingDTO[];
};

export type ExtendedBillingInfoTableView = ExtendedBillingInfo & {
  dateFormatted: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
};

// Dates pre-formatted for display in the history table.
export type BillingInfoTableView = Omit<BillingInfo, "date" | "createdAt" | "updatedAt"> & {
  date: string;
  createdAt: string;
  updatedAt: string;
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

export type BillingInfo = Infer<typeof BILLING_INFO_SELECT_SCHEMA>;

export type NewBillingInfo = Omit<
  Infer<typeof BILLING_INFO_INSERT_SCHEMA>,
  "createdAt" | "updatedAt"
>;

export type TenantReading = Infer<typeof TENANT_READING_SELECT_SCHEMA>;

export type NewTenantReading = Infer<typeof TENANT_READING_INSERT_SCHEMA>;

export type Status = Infer<typeof STATUS_FIELD>;

export type TenantReadingWithRelations = Partial<NewTenantReading> & {
  payment?: Payment;
  tenant?: User;
  billingInfo?: BillingInfo;
};

export type TenantReadingLike = Partial<Pick<TenantReading, "id" | "tenantUserId" | "reading">>;

export type BillingInfoLike = {
  // Dates arrive as strings once serialized to the client.
  date: BillingInfo["date"] | string;
  subMeters?: TenantReadingLike[];
};

/** Row key `id`: for `isNew` rows it is client-only and never sent as a tenant_reading id. */
export type SubMeterForm = Pick<TenantReading, "id" | "tenantUserId" | "reading"> & {
  isNew?: boolean;
  status?: Status;
};
