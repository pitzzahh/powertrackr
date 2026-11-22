import * as v from "valibot";
import { EMAIL_FIELD, ID_FIELD, NAME_FIELD, PASSWORD_FIELD, READING_FIELD } from "./shared.js";

export const CREATE_TENANT_SCHEMA = v.object({
  name: NAME_FIELD,
  email: EMAIL_FIELD,
  password: PASSWORD_FIELD,
});

export const UPDATE_TENANT_SCHEMA = v.object({
  tenantUserId: ID_FIELD,
  name: NAME_FIELD,
});

export const DELETE_TENANT_SCHEMA = v.object({ tenantUserId: ID_FIELD });

// A tenant submits a reading for their own sub-meter, so the tenant is
// implicit from the session. `billingInfoId` links the submission to a pending
// billing period when the tenant is submitting for one.
export const SUBMIT_READING_SCHEMA = v.object({
  billingInfoId: v.optional(ID_FIELD),
  reading: READING_FIELD,
});

// Tenant corrects their most recent submission (e.g. forgot, typo).
export const UPDATE_SUBMISSION_SCHEMA = v.object({ reading: READING_FIELD });
