import type { Infer } from "#lib/validators/shared.js";
import type { BillingInfo, TenantReading } from "#lib/types/billing-info.js";
import type { User } from "#lib/types/user.js";
import type {
  READING_SUBMISSION_INSERT_SCHEMA,
  READING_SUBMISSION_SELECT_SCHEMA,
} from "#lib/validators/entities.js";

export type ReadingSubmission = Infer<typeof READING_SUBMISSION_SELECT_SCHEMA>;

export type NewReadingSubmission = Infer<typeof READING_SUBMISSION_INSERT_SCHEMA>;

type LatestSubmission = Pick<ReadingSubmission, "reading" | "createdAt">;

// Remote query outputs, derived from the entity types.
export type TenantWithMeters = Pick<User, "id" | "name" | "email"> & {
  lastBilledReading: TenantReading["reading"];
  latestSubmission: LatestSubmission | null;
};

export type MyMeter = Pick<User, "name"> & {
  tenantUserId: User["id"];
  lastBilledReading: TenantReading["reading"];
  latestSubmission: LatestSubmission | null;
};

export type PendingBilling = Pick<BillingInfo, "date"> & {
  billingInfoId: BillingInfo["id"];
  lastBilledReading: TenantReading["reading"];
};

/** A billing period whose bill has been computed for this tenant (reading
 * submitted and payment materialized). */
export type ComputedBilling = Pick<BillingInfo, "date" | "payPerkWh"> & {
  billingInfoId: BillingInfo["id"];
  reading: NonNullable<TenantReading["reading"]>;
  usageKwh: NonNullable<TenantReading["subkWh"]>;
  amount: number;
};
