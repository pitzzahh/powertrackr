import { describe, it, expect, vi } from "vitest";

// Simulate an environment with no PLUNK key so the module behaves as a no-op.
// The mock is hoisted so it is in effect when the module under test is imported.
vi.mock("$env/dynamic/private", () => ({ env: {} }));

describe("server/email (Plunk) - no PLUNK key", () => {
  it("createContact should be no-op and return null when PLUNK key is missing", async () => {
    const { createContact } = await import("$/server/email");
    await expect(createContact("user@example.com")).resolves.toBeNull();
  });

  it("sendVerificationEmail should be no-op and return null when PLUNK key is missing", async () => {
    const { sendVerificationEmail } = await import("$/server/email");
    await expect(sendVerificationEmail("user@example.com", "123456", 15)).resolves.toBeNull();
  });
});
