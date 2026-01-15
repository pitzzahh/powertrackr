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

  it("createAndSendEmailVerification should store expiresAt as an ISO string", async () => {
    const mod = await import("$/server/email");
    const spy = vi.spyOn(mod, "sendVerificationEmail").mockResolvedValue(null as any);

    const { addUser } = await import("$/server/crud/user-crud");
    const { createUser } = await import("./helpers/factories");
    const {
      valid,
      value: [user],
    } = await addUser([createUser()]);

    expect(valid).toBe(true);
    expect(user).toBeDefined();

    const verification = await mod.createAndSendEmailVerification(user.id, user.email);
    expect(verification).not.toBeNull();
    // expiresAt should now be an ISO 8601 string stored in the DB
    expect(typeof verification!.expiresAt).toBe("string");
    expect(Date.parse(verification!.expiresAt)).toBeGreaterThan(Date.now());
    // sanity check that parsed value is in milliseconds (greater than ~1e12)
    expect(Date.parse(verification!.expiresAt)).toBeGreaterThan(1_000_000_000_000);

    const { getEmailVerificationRequestBy } =
      await import("$/server/crud/email-verification-request-crud");
    const found = await getEmailVerificationRequestBy({
      query: { userId: user.id },
      options: { limit: 1 },
    });
    expect(found.valid).toBe(true);
    // the DB value should be an ISO string - parse it for numeric comparison
    expect(Date.parse(found.value[0].expiresAt!)).toBeGreaterThan(1_000_000_000_000);

    spy.mockRestore();
  });
});
