import * as v from "valibot";

export const createTenantSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

export const updateTenantSchema = v.object({
  tenantUserId: v.string(),
  name: v.pipe(v.string(), v.minLength(2)),
});

export const deleteTenantSchema = v.object({
  tenantUserId: v.string(),
});

// A tenant submits a reading for their own sub-meter, so the tenant is
// implicit from the session. `billingInfoId` links the submission to a pending
// billing period when the tenant is submitting for one.
export const submitReadingSchema = v.object({
  billingInfoId: v.optional(v.string()),
  reading: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
});

// Tenant corrects their most recent submission (e.g. forgot, typo).
export const updateSubmissionSchema = v.object({
  reading: v.pipe(v.number("must be a number"), v.minValue(0, "must be 0 or greater")),
});
