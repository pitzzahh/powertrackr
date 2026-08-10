const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 5_000;

/**
 * Verifies a Turnstile token against the Cloudflare siteverify API.
 *
 * Fails closed: a missing token or secret, network error, non-2xx response
 * or a `success: false` result all reject the attempt, so a misconfigured
 * or unreachable challenge never lets a request through unverified.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  secret: string,
  remoteIp?: string
): Promise<boolean> {
  if (!token || !secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
