/**
 * Server-side email helpers (DB operations only).
 *
 * This module provides helpers to:
 *  - create an email verification request in the DB
 *  - create a password reset session in the DB
 *
 * Notes:
 *  - Email sending is handled separately via API routes.
 */

import { env } from "$env/dynamic/private";
import { addEmailVerificationRequest } from "$/server/crud/email-verification-request-crud";
import { addPasswordResetSession } from "$/server/crud/password-reset-session-crud";
import { generateRandomOTP } from "./encryption";

/**
 * Create a DB email verification request.
 *
 * Returns the created verification request (the DB inserted row) or null on failure.
 */
export async function createEmailVerification(
  userId: string,
  email: string,
  timeoutMinutes = Number(env.PUBLIC_EMAIL_VERIFICATION_TIMEOUT_MINUTES ?? 15)
) {
  const code = generateRandomOTP();
  // Store expiration as a Date object.
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  // Add to DB
  const added = await addEmailVerificationRequest([{ userId, email, code, expiresAt }]);
  if (!added.valid || !added.value || added.value.length === 0) {
    console.warn("Failed to add email verification request:", added.message);
    return null;
  }

  const [verification] = added.value;

  return verification;
}

/**
 * Create a DB password reset session.
 *
 * Returns the created password reset session (the DB inserted row) or null on failure.
 */
export async function createPasswordReset(
  userId: string,
  email: string,
  timeoutMinutes = Number(env.PASSWORD_RESET_TIMEOUT_MINUTES ?? 15)
) {
  const code = generateRandomOTP();
  // Store expiration as a Date object.
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  // Add to DB
  const {
    valid,
    value: [resetSession],
  } = await addPasswordResetSession([{ userId, email, code, expiresAt }]);
  if (!valid || !resetSession) {
    console.warn("Failed to add password reset session");
    return null;
  }

  return resetSession;
}
