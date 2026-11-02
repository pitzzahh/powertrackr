import { describe, it, expect, vi } from "vitest";
import { isRateLimited } from "#lib/server/rate-limit.js";

describe("isRateLimited", () => {
  it("allows when no limiter binding exists (local vite dev)", async () => {
    await expect(isRateLimited(undefined, "a@b.c")).resolves.toBe(false);
    await expect(isRateLimited(null, "a@b.c")).resolves.toBe(false);
  });

  it("passes through the limiter verdict", async () => {
    const allow = { limit: vi.fn(async () => ({ success: true })) };
    const deny = { limit: vi.fn(async () => ({ success: false })) };
    await expect(isRateLimited(allow, "a@b.c")).resolves.toBe(false);
    await expect(isRateLimited(deny, "a@b.c")).resolves.toBe(true);
    expect(allow.limit).toHaveBeenCalledWith({ key: "a@b.c" });
    expect(deny.limit).toHaveBeenCalledWith({ key: "a@b.c" });
  });
});
