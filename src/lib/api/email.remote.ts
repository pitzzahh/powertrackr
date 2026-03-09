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
import type { EmailVerificationRequest } from "$/types/email-verification-request";

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
    const cookie = event.request.headers.get("cookie");
    const res = await event.fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie && { cookie }),
      },
      body: JSON.stringify({ action: "resendVerification", userId, email }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("API fetch failed:", res.status, res.statusText, text);
      error(500, "Failed to send verification email");
    }
    let data;
    try {
      data = (await res.json()) as {
        success: boolean;
        verification?: EmailVerificationRequest;
        error?: string;
      };
    } catch (e) {
      console.error("Failed to parse API response as JSON:", e);
      error(500, "Failed to send verification email");
    }

    if ("error" in data) {
      console.error("API error:", data.error);
      error(500, "Failed to send verification email");
    } else if (data.success && data.verification) {
      return { success: true, sent: true, requestId: data.verification.id ?? null };
    } else {
      // Best-effort: the helper logs warnings on failure; surface a non-fatal response
      console.warn("API call to resend verification did not succeed for user", userId);
      return { success: false, sent: false };
    }
  } catch (e) {
    console.error("Failed to resend verification email for user", userId, e);
    error(500, "Failed to send verification email");
  }
});
