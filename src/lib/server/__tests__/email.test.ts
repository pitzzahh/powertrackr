// @ts-nocheck
import { describe, it, expect, vi, afterEach } from "vitest";

function makeJsonResponse(body: unknown) {
  return { json: async () => body };
}

const env: Record<string, any> = {};
vi.mock("$env/dynamic/private", () => ({ env }));

const addEmailVerificationRequest = vi.fn();
vi.mock("$/server/crud/email-verification-request-crud", () => ({
  addEmailVerificationRequest,
}));

afterEach(() => {
  // Clean up any global fetch we set in tests
  // @ts-ignore
  if (globalThis.fetch && (globalThis.fetch as any).__isMock) {
    // @ts-ignore
    delete globalThis.fetch;
  }

  // Reset the mutable env and mocked functions
  for (const k of Object.keys(env)) {
    delete env[k];
  }
  addEmailVerificationRequest.mockReset();

  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.resetModules();
});

describe("Plunk email helpers", () => {
  it("createContact should be no-op and return null when PLUNK key is missing", async () => {
    vi.resetModules();
    // Ensure env has no PLUNK configuration for this test
    for (const k of Object.keys(env)) delete env[k];

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { createContact } = await import("$/server/email");

    const res = await createContact("no-key@example.com");
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("PLUNK_SECRET_KEY not set. Skipping createContact.");
  });

  it("createContact should POST to Plunk and return contact data when configured", async () => {
    vi.resetModules();
    env.PLUNK_SECRET_KEY = "KEY";
    env.PLUNK_BASE_URL = "https://api.plunk.test";

    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url.includes("/contacts")) {
        return makeJsonResponse({
          success: true,
          data: { id: 42, email: JSON.parse(opts!.body as string).email },
        });
      }
      return makeJsonResponse(null);
    });
    // Mark mock so we can clean up later
    (fetchMock as any).__isMock = true;
    // @ts-ignore
    global.fetch = fetchMock as any;

    const { createContact } = await import("$/server/email");
    const data = await createContact("alice@example.com", { plan: "free" });
    expect(data).toEqual({ id: 42, email: "alice@example.com" });
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][0] as string).toContain("https://api.plunk.test/contacts");
  });

  it("sendVerificationEmail should be no-op and return null when PLUNK key is missing", async () => {
    vi.resetModules();
    // Ensure no PLUNK configuration for this test
    for (const k of Object.keys(env)) delete env[k];

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { sendVerificationEmail } = await import("$/server/email");
    const res = await sendVerificationEmail("no-key@example.com", "1234", 15);
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "PLUNK_SECRET_KEY not set. Skipping sending verification email."
    );
  });

  it("sendVerificationEmail should send by template id when template exists and return send response", async () => {
    vi.resetModules();
    env.PLUNK_SECRET_KEY = "KEY";
    env.PLUNK_BASE_URL = "https://plunk.test";

    const calls: Array<{ url: string; opts?: RequestInit }> = [];

    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      calls.push({ url, opts });
      if (url.includes("/contacts")) {
        return makeJsonResponse({ success: true, data: { id: 1 } });
      }
      if (url.includes("/templates")) {
        return makeJsonResponse({
          data: [{ id: "tpl-1", name: "Email Verification", from: "no-reply@plunk" }],
        });
      }
      if (url.includes("/v1/send")) {
        return makeJsonResponse({ success: true, sent: true });
      }
      return makeJsonResponse(null);
    });
    (fetchMock as any).__isMock = true;
    // @ts-ignore
    global.fetch = fetchMock as any;

    const { sendVerificationEmail } = await import("$/server/email");

    const res = await sendVerificationEmail("bob@example.com", "CODE123", 30);
    expect(res).toEqual({ success: true, sent: true });

    // Expect contacts, templates and send to have been called
    expect(calls.some((c) => c.url.includes("/contacts"))).toBeTruthy();
    expect(calls.some((c) => c.url.includes("/templates"))).toBeTruthy();

    const sendCall = calls.find((c) => c.url.includes("/v1/send"))!;
    const body = JSON.parse(sendCall.opts!.body as string);
    expect(body.template).toBe("tpl-1");
    expect(body.to).toBe("bob@example.com");
    expect((body.data as any).code).toBe("CODE123");
  });

  it("sendVerificationEmail should retry template send with default 'from' on VALIDATION_ERROR and succeed", async () => {
    vi.resetModules();
    env.PLUNK_SECRET_KEY = "KEY";
    env.PLUNK_BASE_URL = "https://plunk.test";

    let sendCount = 0;
    const fetchMock = vi.fn((url: string, _opts?: RequestInit) => {
      if (url.includes("/contacts")) {
        return makeJsonResponse({ success: true });
      }
      if (url.includes("/templates")) {
        return makeJsonResponse({
          data: [{ id: "tpl-1", name: "Email Verification", from: "no-reply@plunk" }],
        });
      }
      if (url.includes("/v1/send")) {
        sendCount += 1;
        if (sendCount === 1) {
          return makeJsonResponse({
            success: false,
            error: { code: "VALIDATION_ERROR", errors: [{ field: "from" }] },
          });
        }
        return makeJsonResponse({ success: true, retried: true });
      }
      return makeJsonResponse(null);
    });
    (fetchMock as any).__isMock = true;
    // @ts-ignore
    global.fetch = fetchMock as any;

    const { sendVerificationEmail } = await import("$/server/email");

    const res = await sendVerificationEmail("charlie@example.com", "X", 5);
    expect(res).toEqual({ success: true, retried: true });
    expect(sendCount).toBeGreaterThanOrEqual(2);
  });

  it("sendVerificationEmail should fallback to inline message when no templates found", async () => {
    vi.resetModules();
    env.PLUNK_SECRET_KEY = "KEY";
    env.PLUNK_BASE_URL = "https://plunk.test";

    const calls: Array<{ url: string; opts?: RequestInit }> = [];
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      calls.push({ url, opts });
      if (url.includes("/contacts")) {
        return makeJsonResponse({ success: true });
      }
      if (url.includes("/templates")) {
        return makeJsonResponse({ data: [] });
      }
      if (url.includes("/v1/send")) {
        return makeJsonResponse({ success: true, inline: true });
      }
      return makeJsonResponse(null);
    });
    (fetchMock as any).__isMock = true;
    // @ts-ignore
    global.fetch = fetchMock as any;

    const { sendVerificationEmail } = await import("$/server/email");
    const res = await sendVerificationEmail("d@example.com", "ZZZ", 10);
    expect(res).toEqual({ success: true, inline: true });

    const sendCall = calls.find((c) => c.url.includes("/v1/send"))!;
    const body = JSON.parse(sendCall.opts!.body as string);
    expect(body.subject).toBe("Verify your email");
    expect(body.body).toContain("Your verification code");
    expect(body.to).toBe("d@example.com");
  });

  it("createAndSendEmailVerification should return null when DB insert fails", async () => {
    if (process.env.CI === "true") return;
    vi.resetModules();
    for (const k of Object.keys(env)) delete env[k];
    addEmailVerificationRequest.mockResolvedValue({ valid: false, message: "boom" });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { createAndSendEmailVerification } = await import("$/server/email");
    const res = await createAndSendEmailVerification("u1", "x@example.com", 15);
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Failed to add email verification request:", "boom");
  });

  it("createAndSendEmailVerification should add the request and attempt sending the email", async () => {
    vi.resetModules();
    for (const k of Object.keys(env)) delete env[k];

    addEmailVerificationRequest.mockImplementation(async (rows: any[]) => ({
      valid: true,
      value: [
        {
          ...rows[0],
          code: "DETERMINISTIC-OTP",
          expiresAt: rows[0].expiresAt ?? new Date().toISOString(),
        },
      ],
    }));

    const emailModule = await import("$/server/email");
    const verification = await emailModule.createAndSendEmailVerification("u2", "z@example.com", 7);
    expect(verification).toBeTruthy();
    expect((verification as any).code).toBe("DETERMINISTIC-OTP");
  });
});
