/**
 * Server-side email helpers (Plunk integration).
 *
 * This module provides small, resilient helpers to:
 *  - create a contact in Plunk (best-effort)
 *  - send a verification email (prefer using a template named "Email Verification",
 *    falling back to a simple inline HTML email)
 *  - create an email verification request in the DB and send the verification email
 *
 * Notes:
 *  - PLUNK secret key is read from the private environment: `PLUNK_SECRET_KEY` or `PLUNK_API_KEY`
 *  - Template variable substitution is intentionally simple (string replacements for common patterns).
 *  - All external network calls are best-effort and won't throw on missing configuration;
 *    they will log warnings instead so the rest of the flow can continue in development.
 */

import { env } from "$env/dynamic/private";
import { addEmailVerificationRequest } from "$/server/crud/email-verification-request-crud";
import type { NewEmailVerificationRequest } from "$/types/email-verification-request";

const PLUNK_BASE = env.PLUNK_BASE_URL ?? "https://api.plunk.com";
const PLUNK_KEY = env.PLUNK_SECRET_KEY ?? undefined;

import type { PlunkTemplate, PlunkContact } from "$/types/plunk";

/** Whether the Plunk client is configured (secret key present) */
export const isPlunkConfigured = Boolean(PLUNK_KEY);

/** Internal helper to attach auth header (when available) */
function getAuthHeaders(): Record<string, string> {
  return PLUNK_KEY
    ? { Authorization: `Bearer ${PLUNK_KEY}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/** Generic fetch wrapper for Plunk API */
async function plunkRequest(path: string, options: RequestInit = {}) {
  const url = `${PLUNK_BASE}${path}`;
  const headers = { ...options.headers, ...getAuthHeaders() };
  const res = await fetch(url, { ...options, headers });
  return res;
}

/** Apply variables into simple templates. Handles common placeholder variants. */
function applyTemplateVariables(template: string, variables: Record<string, string | number>) {
  let result = template;
  for (const [k, v] of Object.entries(variables)) {
    // Support multiple placeholder formats: {{key}}, {key}, %key%, ${key}
    const patterns = [
      new RegExp(`{{\\s*${k}\\s*}}`, "g"),
      new RegExp(`{\\s*${k}\\s*}`, "g"),
      new RegExp(`%${k}%`, "g"),
      new RegExp(`\\$\\{${k}\\}`, "g"),
    ];
    for (const p of patterns) {
      result = result.replace(p, String(v));
    }
  }
  return result;
}

/**
 * Create or update a contact in Plunk (best-effort).
 * Returns the created/updated contact data or null when skipped/failed.
 */
export async function createContact(
  email: string,
  data?: Record<string, unknown>
): Promise<PlunkContact | null> {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping createContact.");
    return null;
  }

  try {
    const resp = await plunkRequest("/contacts", {
      method: "POST",
      body: JSON.stringify({ email, subscribed: true, data: data ?? {} }),
    });
    const json = await resp.json().catch(() => null);
    if (!json || json.success === false) {
      console.warn("Plunk create contact failed:", json?.error ?? json);
      return null;
    }
    return json.data as PlunkContact;
  } catch (e) {
    console.warn("Failed to create Plunk contact:", e);
    return null;
  }
}

/**
 * Send a verification email to the recipient.
 *
 * Strategy:
 * 1) Attempt to find a template named exactly "Email Verification" (case-insensitive).
 *    - If found, try to populate it with variables and send a simple inline email using
 *      the resolved subject/body (this is safe and does not depend on unknown template API fields).
 * 2) If template not found or an error occurs, fall back to sending a basic inline HTML email.
 *
 * This function is resilient: missing configuration or remote failures will log warnings but not throw.
 */
export async function sendVerificationEmail(email: string, code: string, timeoutMinutes: number) {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping sending verification email.");
    return null;
  }

  // Ensure the contact exists (best-effort)
  await createContact(email);

  // Try to fetch templates and find the one we want
  try {
    const tplResp = await plunkRequest("/templates?limit=100", { method: "GET" });
    const tplJson = await tplResp.json().catch(() => null);
    // Normalize different possible response shapes:
    // - { data: { items: [...] } }
    // - { data: [...] }
    // - direct array
    const rawData = tplJson?.data ?? tplJson;
    const items: PlunkTemplate[] = Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData)
        ? (rawData as PlunkTemplate[])
        : [];
    const tpl = items.find((t) => (t?.name ?? "").toLowerCase() === "email verification");
    if (tpl && tpl.id) {
      // Preferred: send by template ID and pass variables in `data` (e.g. code, timeout).
      const payload: Record<string, unknown> = {
        to: email,
        template: tpl.id,
        data: { code, timeout: `${timeoutMinutes} minutes` },
      };

      try {
        const sendResp = await plunkRequest("/v1/send", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const sendJson = await sendResp.json().catch(() => null);

        // If Plunk complains about a missing sender ('from') retry with the default sender
        if (
          sendJson &&
          sendJson.success === false &&
          sendJson.error?.code === "VALIDATION_ERROR" &&
          Array.isArray(sendJson.error?.errors) &&
          (sendJson.error.errors as any[]).some((e) => e.field === "from")
        ) {
          const sendResp2 = await plunkRequest("/v1/send", {
            method: "POST",
            body: JSON.stringify({ ...payload, from: tpl.from }),
          });
          const sendJson2 = await sendResp2.json().catch(() => null);
          if (sendJson2 && sendJson2.success) return sendJson2;
          console.warn("Plunk send (template + from retry) failed:", sendJson2?.error ?? sendJson2);
        }

        if (sendJson && sendJson.success) return sendJson;
        console.warn("Plunk send (template id) failed:", sendJson?.error ?? sendJson);
      } catch (e) {
        console.warn("Error sending with Plunk template id:", e);
      }

      // Fallback: if the template send fails, render the template content locally (if available)
      // and send a simple inline message while including a default `from`.
      const subject = (tpl.subject as string) ?? `Verify your email`;
      const raw = (tpl.html as string) ?? (tpl.content as string) ?? (tpl.body as string) ?? "";
      const body = raw
        ? applyTemplateVariables(raw, { code, timeout: `${timeoutMinutes} minutes` })
        : `<p>Your verification code is <strong>${code}</strong>. It expires in ${timeoutMinutes} minutes.</p>`;

      const sendRespFallback = await plunkRequest("/v1/send", {
        method: "POST",
        body: JSON.stringify({ to: email, subject, body, from: tpl.from }),
      });
      const sendJsonFallback = await sendRespFallback.json().catch(() => null);
      if (!sendJsonFallback || sendJsonFallback.success === false) {
        console.warn(
          "Plunk send (template fallback) failed:",
          sendJsonFallback?.error ?? sendJsonFallback
        );
      }
      return sendJsonFallback;
    }
  } catch (e) {
    console.warn("Error while fetching templates from Plunk:", e);
  }

  // Fallback: send a simple inline message
  try {
    const subject = "Verify your email";
    const body = `<p>Your verification code is <strong>${code}</strong>. It expires in ${timeoutMinutes} minutes.</p>`;
    const sendResp = await plunkRequest("/v1/send", {
      method: "POST",
      body: JSON.stringify({ to: email, subject, body }),
    });
    const sendJson = await sendResp.json().catch(() => null);
    if (!sendJson || sendJson.success === false) {
      console.warn("Plunk send (fallback) failed:", sendJson?.error ?? sendJson);
    }
    return sendJson;
  } catch (e) {
    console.warn("Failed to send verification email via Plunk:", e);
    return null;
  }
}

/**
 * Convenience: create a DB email verification request and send the email.
 *
 * Returns the created verification request (the DB inserted row) or null on failure.
 */
export async function createAndSendEmailVerification(
  userId: string,
  email: string,
  timeoutMinutes = Number(env.EMAIL_VERIFICATION_TIMEOUT_MINUTES ?? 15)
) {
  // Generate a 6-digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Math.floor((Date.now() + timeoutMinutes * 60 * 1000) / 1000);

  // Add to DB
  const added = await addEmailVerificationRequest([{ userId, email, code, expiresAt }]);
  if (!added.valid || !added.value || added.value.length === 0) {
    console.warn("Failed to add email verification request:", added.message);
    return null;
  }

  const verification = added.value[0] as NewEmailVerificationRequest;

  // Best-effort send
  await sendVerificationEmail(email, verification.code, timeoutMinutes);

  return verification;
}
