/**
 * Row schemas generated from the Drizzle tables, and the entity types inferred
 * from them. The tables are the single source of truth: a column change flows
 * into these schemas and types automatically.
 *
 * Server-only at runtime (it imports `#lib/server/db/schema`). Client code may
 * only `import type` from here.
 */
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import {
  billingInfo,
  emailVerificationRequest,
  passwordResetSession,
  payment,
  readingSubmission,
  session,
  tenantReading,
  user,
} from "#lib/server/db/schema/index.js";

export const USER_SELECT_SCHEMA = createSelectSchema(user);
export const USER_INSERT_SCHEMA = createInsertSchema(user);

export const SESSION_SELECT_SCHEMA = createSelectSchema(session);
export const SESSION_INSERT_SCHEMA = createInsertSchema(session);

export const EMAIL_VERIFICATION_REQUEST_SELECT_SCHEMA =
  createSelectSchema(emailVerificationRequest);
export const EMAIL_VERIFICATION_REQUEST_INSERT_SCHEMA =
  createInsertSchema(emailVerificationRequest);

export const PASSWORD_RESET_SESSION_SELECT_SCHEMA = createSelectSchema(passwordResetSession);
export const PASSWORD_RESET_SESSION_INSERT_SCHEMA = createInsertSchema(passwordResetSession);

export const PAYMENT_SELECT_SCHEMA = createSelectSchema(payment);
export const PAYMENT_INSERT_SCHEMA = createInsertSchema(payment);

// `status` is free text in SQLite, so rows keep `string`; forms narrow it via
// STATUS_FIELD before anything is written.
export const BILLING_INFO_SELECT_SCHEMA = createSelectSchema(billingInfo);
export const BILLING_INFO_INSERT_SCHEMA = createInsertSchema(billingInfo);

export const TENANT_READING_SELECT_SCHEMA = createSelectSchema(tenantReading);
export const TENANT_READING_INSERT_SCHEMA = createInsertSchema(tenantReading);

export const READING_SUBMISSION_SELECT_SCHEMA = createSelectSchema(readingSubmission);
export const READING_SUBMISSION_INSERT_SCHEMA = createInsertSchema(readingSubmission);
