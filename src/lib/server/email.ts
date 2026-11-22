/**
 * Server-side email helpers (DB operations and email sending).
 *
 * This module provides helpers to:
 *  - create an email verification request in the DB and send verification email
 *  - create a password reset session in the DB and send password reset email
 */
import {
  PLUNK_BASE_URL,
  PLUNK_SECRET_KEY,
  BASE_URL,
  PASSWORD_RESET_TIMEOUT_MINUTES,
} from "$app/env/private";
import { EMAIL_VERIFICATION_TIMEOUT_MINUTES } from "$app/env/public";

import { addEmailVerificationRequest } from "#lib/server/crud/email-verification-request-crud.js";
import { addPasswordResetSession } from "#lib/server/crud/password-reset-session-crud.js";
import { generateRandomOTP } from "./encryption";
import { parsePlunkResult, parsePlunkTemplates } from "#lib/validators/plunk.js";

/** Whether the Plunk client is configured (secret key present) */
const PLUNK_BASE = PLUNK_BASE_URL ?? "https://api.plunk.com";

const PLUNK_KEY = PLUNK_SECRET_KEY ?? undefined;

/** Internal helper to attach auth header (when available) */
function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${PLUNK_KEY}`,
    "User-Agent": "PowerTrackr/1.0",
    "Content-Type": "application/json",
  };
}

/** Fetch a Plunk endpoint; the raw JSON body (or null) goes to a validator parser. */
async function plunkRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const req = new Request(`${PLUNK_BASE}${path}`, options);

  // Only set the headers YOU control — never forward event.request.headers
  for (const [key, value] of Object.entries(getAuthHeaders())) {
    req.headers.set(key, value);
  }
  const res = await fetch(req);
  return res.json().catch(() => null);
}

/** Send a JSON body to Plunk and parse the success/error envelope. */
async function plunkPost(path: string, body: unknown) {
  return parsePlunkResult(await plunkRequest(path, { method: "POST", body: JSON.stringify(body) }));
}

/** Create or update a contact in Plunk (best-effort, never throws). */
async function createContact(email: string): Promise<void> {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping createContact.");
    return;
  }

  try {
    const result = await plunkPost("/contacts", { email, subscribed: true, data: {} });
    if (!result?.success) console.warn("Plunk create contact failed:", result);
  } catch (e) {
    console.warn("Failed to create Plunk contact:", e);
  }
}

type CodeEmail = {
  /** Plunk template name, matched case-insensitively. */
  template: string;
  /** Subject of the inline fallback email. */
  subject: string;
  /** Lead text of the inline fallback email, e.g. "Your verification code". */
  intro: string;
  /** `act` query value of the link in the email. */
  act: "verify-email" | "reset-password";
};

/**
 * Send an email carrying a one-time code and a link to the matching auth page.
 *
 * Prefers the Plunk template named `template` (code, timeout and link passed
 * as variables); if the template is missing or sending fails, falls back to a
 * plain inline email. Missing configuration or remote failures log warnings
 * and never throw.
 */
async function sendCodeEmail(
  kind: CodeEmail,
  email: string,
  code: string,
  origin: string,
  timeoutMinutes: number
) {
  if (!PLUNK_KEY) {
    console.warn(`PLUNK_SECRET_KEY not set. Skipping "${kind.template}" email.`);
    return null;
  }
  const link = `${BASE_URL ?? origin}/auth?act=${kind.act}&code=${code}`;
  const timeout = `${timeoutMinutes} ${timeoutMinutes === 1 ? "minute" : "minutes"}`;

  try {
    const templates = parsePlunkTemplates(
      await plunkRequest("/templates?limit=100", { method: "GET" })
    );
    const tpl = templates.find((t) => t.name.toLowerCase() === kind.template.toLowerCase());
    if (tpl) {
      const payload = { to: email, template: tpl.id, data: { code, timeout, link } };
      const sent = await plunkPost("/v1/send", payload);
      if (sent?.success) return sent;

      // Plunk rejects templates without a sender: retry with the template's.
      const missingFrom =
        sent?.success === false &&
        sent.error?.code === "VALIDATION_ERROR" &&
        (sent.error.errors ?? []).some((e) => e.field === "from");
      if (missingFrom) {
        const retry = await plunkPost("/v1/send", { ...payload, from: tpl.from });
        if (retry?.success) return retry;
        console.warn("Plunk send (template + from retry) failed:", retry);
      } else {
        console.warn("Plunk send (template id) failed:", sent);
      }
    }
  } catch (e) {
    console.warn(`Error sending "${kind.template}" with a Plunk template:`, e);
  }

  // Fallback: a simple inline message
  try {
    const body = `<p>${kind.intro} is <strong>${code}</strong>. It expires in ${timeout}.</p><p><a href="${link}">${kind.subject}</a></p>`;
    const sent = await plunkPost("/v1/send", { to: email, subject: kind.subject, body });
    if (!sent?.success) console.warn("Plunk send (fallback) failed:", sent);
    return sent;
  } catch (e) {
    console.warn(`Failed to send "${kind.template}" email via Plunk:`, e);
    return null;
  }
}

const VERIFICATION_EMAIL: CodeEmail = {
  template: "Email Verification",
  subject: "Verify your email",
  intro: "Your verification code",
  act: "verify-email",
};

const PASSWORD_RESET_EMAIL: CodeEmail = {
  template: "Password Reset",
  subject: "Reset your password",
  intro: "Your password reset code",
  act: "reset-password",
};

/**
 * Create a DB email verification request.
 *
 * Returns the created verification request (the DB inserted row) or null on failure.
 */
export async function createEmailVerification(
  userId: string,
  email: string,
  origin: string,
  timeoutMinutes = Number(EMAIL_VERIFICATION_TIMEOUT_MINUTES || 1)
) {
  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

  // Add to DB
  const added = await addEmailVerificationRequest([{ userId, email, code, expiresAt }]);
  if (!added.valid || !added.value || added.value.length === 0) {
    console.warn("Failed to add email verification request:", added.message);
    return null;
  }

  const [verification] = added.value;

  if (verification) {
    // Contact sync is best-effort, but awaited: Workers cancel stray promises.
    await createContact(email);
    await sendCodeEmail(VERIFICATION_EMAIL, email, verification.code, origin, timeoutMinutes);
  }

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
  baseUrl: string,
  timeoutMinutes = Number(PASSWORD_RESET_TIMEOUT_MINUTES || 1)
) {
  const code = generateRandomOTP();
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

  await sendCodeEmail(PASSWORD_RESET_EMAIL, email, resetSession.code, baseUrl, timeoutMinutes);

  return resetSession;
}
