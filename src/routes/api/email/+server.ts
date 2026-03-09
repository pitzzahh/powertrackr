import { json, type RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { createEmailVerification, createPasswordReset } from "$/server/email";
import type {
  PlunkTemplate,
  PlunkContact,
  PlunkAPIResponse,
  PlunkListData,
  PlunkSendResponseData,
} from "$/types/plunk";

/** Whether the Plunk client is configured (secret key present) */
const PLUNK_BASE = env.PLUNK_BASE_URL ?? "https://api.plunk.com";
const PLUNK_KEY = env.PLUNK_SECRET_KEY ?? undefined;

/** Internal helper to attach auth header (when available) */
function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${PLUNK_KEY}`,
    "User-Agent": "PowerTrackr/1.0",
    "Content-Type": "application/json",
  };
}

/** Generic fetch wrapper for Plunk API */
async function plunkRequest<T>(
  event: RequestEvent,
  path: string,
  options: RequestInit = {}
): Promise<PlunkAPIResponse<T> | null> {
  const url = `${PLUNK_BASE}${path}`;
  const req = new Request(url, options);

  // Only set the headers YOU control — never forward event.request.headers
  for (const [key, value] of Object.entries(getAuthHeaders())) {
    req.headers.set(key, value);
  }
  console.log(req);
  const res = await event.fetch(req);
  return (await res.json().catch(() => null)) as PlunkAPIResponse<T> | null;
}
/**
 * Create or update a contact in Plunk (best-effort).
 * Returns the created/updated contact data or null when skipped/failed.
 */
async function createContact(
  event: RequestEvent,
  email: string,
  data?: Record<string, unknown>
): Promise<PlunkContact | null> {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping createContact.");
    return null;
  }

  try {
    const json = await plunkRequest<PlunkContact>(event, "/contacts", {
      method: "POST",
      body: JSON.stringify({ email, subscribed: true, data: data ?? {} }),
    });
    if (!json || json.success === false) {
      console.warn("Plunk create contact failed:", json?.error ?? json);
      return null;
    }
    return json.data;
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
async function sendVerificationEmail(
  event: RequestEvent,
  email: string,
  code: string,
  timeoutMinutes: number
) {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping sending verification email.");
    return null;
  }

  try {
    // Ensure the contact exists (best-effort)
    void createContact(event, email);
    // Try to fetch templates and find the one we want
    const tplJson = await plunkRequest<PlunkListData<PlunkTemplate>>(
      event,
      "/templates?limit=100",
      {
        method: "GET",
      }
    );
    // Normalize different possible response shapes:
    // - { data: { items: [...] } }
    // - { data: [...] }
    // - direct array
    const rawData: any = (tplJson && tplJson.success ? tplJson.data : null) ?? tplJson;
    const items: PlunkTemplate[] = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.items)
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
        const sendJson = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // If Plunk complains about a missing sender ('from') retry with the default sender
        if (
          sendJson &&
          sendJson.success === false &&
          sendJson.error?.code === "VALIDATION_ERROR" &&
          Array.isArray(sendJson.error?.errors) &&
          (sendJson.error.errors as any[]).some((e) => e.field === "from")
        ) {
          const sendJson2 = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
            method: "POST",
            body: JSON.stringify({ ...payload, from: tpl.from }),
          });
          if (sendJson2 && sendJson2.success) return sendJson2;
          console.warn("Plunk send (template + from retry) failed:", sendJson2?.error ?? sendJson2);
        }

        if (sendJson && sendJson.success) return sendJson;
        console.warn("Plunk send (template id) failed:", sendJson?.error ?? sendJson);
      } catch (e) {
        console.warn("Error sending with Plunk template id:", e);
      }
    }
  } catch (e) {
    console.warn("Error while fetching templates from Plunk:", e);
  }

  // Fallback: send a simple inline message
  try {
    const subject = "Verify your email";
    const body = `<p>Your verification code is <strong>${code}</strong>. It expires in ${timeoutMinutes} minutes.</p>`;
    const sendJson = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
      method: "POST",
      body: JSON.stringify({ to: email, subject, body }),
    });
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
 * Send a password reset email to the recipient.
 *
 * Strategy:
 * 1) Attempt to find a template named exactly "Password Reset" (case-insensitive).
 *    - If found, try to populate it with variables and send a simple inline email using
 *      the resolved subject/body (this is safe and does not depend on unknown template API fields).
 * 2) If template not found or an error occurs, fall back to sending a basic inline HTML email.
 *
 * This function is resilient: missing configuration or remote failures will log warnings but not throw.
 */
async function sendPasswordResetEmail(
  event: RequestEvent,
  email: string,
  code: string,
  timeoutMinutes: number
) {
  if (!PLUNK_KEY) {
    console.warn("PLUNK_SECRET_KEY not set. Skipping sending password reset email.");
    return null;
  }

  // Try to fetch templates and find the one we want
  try {
    const tplJson = await plunkRequest<PlunkListData<PlunkTemplate>>(
      event,
      "/templates?limit=100",
      {
        method: "GET",
      }
    );

    const rawData: any = (tplJson && tplJson.success ? tplJson.data : null) ?? tplJson;
    const items: PlunkTemplate[] = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData)
          ? (rawData as PlunkTemplate[])
          : [];
    const tpl = items.find((t) => (t?.name ?? "").toLowerCase() === "password reset");
    if (tpl && tpl.id) {
      // Preferred: send by template ID and pass variables in `data` (e.g. code, timeout).
      const payload: Record<string, unknown> = {
        to: email,
        template: tpl.id,
        data: {
          code,
          timeout: `${timeoutMinutes} minutes`,
          link: `${env.BASE_URL ?? "http://localhost:5173"}/auth?act=reset-password&code=${code}`,
        },
      };

      try {
        const sendJson = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // If Plunk complains about a missing sender ('from') retry with the default sender
        if (
          sendJson &&
          sendJson.success === false &&
          sendJson.error?.code === "VALIDATION_ERROR" &&
          Array.isArray(sendJson.error?.errors) &&
          (sendJson.error.errors as any[]).some((e) => e.field === "from")
        ) {
          const sendJson2 = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
            method: "POST",
            body: JSON.stringify({ ...payload, from: tpl.from }),
          });
          if (sendJson2 && sendJson2.success) return sendJson2;
          console.warn("Plunk send (template + from retry) failed:", sendJson2?.error ?? sendJson2);
        }

        if (sendJson && sendJson.success) return sendJson;
        console.warn("Plunk send (template id) failed:", sendJson?.error ?? sendJson);
      } catch (e) {
        console.warn("Error sending with Plunk template id:", e);
      }
    }
  } catch (e) {
    console.warn("Error while fetching templates from Plunk:", e);
  }

  // Fallback: send a simple inline message
  try {
    const subject = "Reset your password";
    const body = `<p>Your password reset code is <strong>${code}</strong>. It expires in ${timeoutMinutes} minutes.</p><p>Or click here: <a href="${env.BASE_URL ?? "http://localhost:5173"}/auth?act=reset-password&code=${code}">Reset Password</a></p>`;
    const sendJson = await plunkRequest<PlunkSendResponseData>(event, "/v1/send", {
      method: "POST",
      body: JSON.stringify({ to: email, subject, body }),
    });
    if (!sendJson || sendJson.success === false) {
      console.warn("Plunk send (fallback) failed:", sendJson?.error ?? sendJson);
    }
    return sendJson;
  } catch (e) {
    console.warn("Failed to send password reset email via Plunk:", e);
    return null;
  }
}

type EmailApiRequest =
  | { action: "resendVerification"; userId: string; email: string; timeoutMinutes?: number }
  | { action: "sendPasswordReset"; userId: string; email: string };

export async function POST(event: RequestEvent) {
  const { request } = event;
  let body: EmailApiRequest;
  try {
    body = await request.json();
  } catch (e) {
    console.error("Failed to parse request JSON:", e);
    return json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "resendVerification") {
    // Check authentication for resend verification
    if (!event.locals.user && !event.locals.session) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { userId, email, timeoutMinutes } = body;
    let verification;
    try {
      verification = await createEmailVerification(userId, email, timeoutMinutes);
    } catch (e) {
      console.error("Failed to create email verification:", e);
      return json({ success: false, error: "Database error" }, { status: 500 });
    }
    if (verification) {
      // Fire-and-forget send (do not block response)
      await sendVerificationEmail(event, email, verification.code, timeoutMinutes ?? 15).catch(
        () => null
      );
    }
    const response = verification ? { success: true, verification } : { success: false };
    return json(response);
  } else if (body.action === "sendPasswordReset") {
    const { userId, email } = body;
    let reset;
    try {
      reset = await createPasswordReset(userId, email);
    } catch (e) {
      console.error("Failed to create password reset:", e);
      return json({ success: false, error: "Database error" }, { status: 500 });
    }
    if (reset) {
      // Fire-and-forget send (do not block response)
      await sendPasswordResetEmail(event, email, reset.code, 15).catch(() => null);
    }
    const response = reset ? { success: true, reset } : { success: false };
    return json(response);
  } else {
    const response = { success: false, error: "Unknown action" };
    return json(response, { status: 400 });
  }
}
