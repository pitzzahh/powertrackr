import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "$/server/turnstile";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SECRET = "test-secret";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyTurnstileToken", () => {
  it("returns true when siteverify reports success and sends secret/token/ip", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken("token", SECRET, "1.2.3.4")).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SITEVERIFY_URL);
    const body = new URLSearchParams(String(init.body));
    expect(body.get("secret")).toBe(SECRET);
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("returns false when siteverify reports failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: false, "error-codes": ["invalid-input-response"] })
        )
    );

    await expect(verifyTurnstileToken("token", SECRET)).resolves.toBe(false);
  });

  it("returns false on a non-2xx siteverify response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ success: true }, 500)));

    await expect(verifyTurnstileToken("token", SECRET)).resolves.toBe(false);
  });

  it("returns false when siteverify is unreachable (fails closed)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(verifyTurnstileToken("token", SECRET)).resolves.toBe(false);
  });

  it("returns false for a missing token without calling siteverify", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken(undefined, SECRET)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns false for a missing secret without calling siteverify", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken("token", "")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
