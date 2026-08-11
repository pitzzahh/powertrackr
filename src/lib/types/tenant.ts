export type TenantWithMeters = {
  id: string;
  name: string;
  email: string;
  lastBilledReading: number | null;
  latestSubmission: { reading: number; createdAt: Date } | null;
};

export type MyMeter = {
  tenantUserId: string;
  name: string;
  lastBilledReading: number | null;
  latestSubmission: { reading: number; createdAt: Date } | null;
};

export type PendingBilling = {
  billingInfoId: string;
  date: Date;
  lastBilledReading: number | null;
};

/** A billing period whose bill has been computed for this tenant (reading
 * submitted and payment materialized). */
export type ComputedBilling = {
  billingInfoId: string;
  date: Date;
  reading: number;
  usageKwh: number;
  payPerkWh: number;
  amount: number;
};
