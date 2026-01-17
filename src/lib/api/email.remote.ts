/**
 * Remote commands for email-related actions.
 *
 * Provides a command to resend the email verification for the current
 * authenticated user. This runs on the server and calls into the
 * server-side email helpers which actually create the DB request and
 * attempt to send the email.
 */

import { command, getRequestEvent } from "$app/server";
import { error } from "@sveltejs/kit";
import { createAndSendEmailVerification } from "$/server/email";

export const resendVerification = command(async () => {
  const event = getRequestEvent();

  // Ensure user is authenticated
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  const userId = event.locals.session.userId;
  const email = event.locals.user.email;

  if (!email) {
    error(400, "No email associated with this account");
  }

  // If already verified, there's nothing to do
  if (event.locals.user.emailVerified) {
    return { success: true, alreadyVerified: true };
  }

  try {
    const verification = await createAndSendEmailVerification(userId, email);

    if (!verification) {
      // Best-effort: the helper logs warnings on failure; surface a non-fatal response
      console.warn("createAndSendEmailVerification did not create a verification for user", userId);
      return { success: false, sent: false };
    }

    return { success: true, sent: true, requestId: verification.id ?? null };
  } catch (e) {
    console.error("Failed to resend verification email for user", userId, e);
    error(500, "Failed to send verification email");
  }
});
