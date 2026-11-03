import { describe, it, expect, vi } from "vitest";

vi.mock("$app/env/public", () => ({
  EMAIL_VERIFICATION_TIMEOUT_MINUTES: "1",
}));

const mockedEnv = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }));
vi.mock("cloudflare:workers", () => ({
  get env() {
    return mockedEnv.value;
  },
}));

import { load } from "#routes/auth/+page.server.js";

function event(act: string): Parameters<typeof load>[0] {
  return {
    url: new URL(`http://localhost/auth?act=${act}`),
    locals: { user: null, session: null },
  } as unknown as Parameters<typeof load>[0];
}

describe("auth page load", () => {
  it("passes through the turnstile site key from bindings", async () => {
    mockedEnv.value = { TURNSTILE_SITE_KEY: "key" };
    const data = await load(event("register"));
    expect(data).toEqual({ action: "register", code: null, turnstileSiteKey: "key" });
  });

  it("yields no site key when the binding is missing", async () => {
    mockedEnv.value = {};
    const data = await load(event("login"));
    expect(data).toEqual({ action: "login", code: null, turnstileSiteKey: undefined });
  });
});
