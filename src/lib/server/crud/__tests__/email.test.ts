import { describe, it, expect } from "vitest";

describe("server/email", () => {
  it("createEmailVerification should create a verification request with expiresAt as Date", async () => {
    const { createEmailVerification } = await import("$/server/email");

    const { addUser } = await import("$/server/crud/user-crud");
    const { createUser } = await import("./helpers/factories");
    const {
      valid,
      value: [user],
    } = await addUser([createUser()]);

    expect(valid).toBe(true);
    expect(user).toBeDefined();

    const verification = await createEmailVerification(user.id, user.email);
    expect(verification).not.toBeNull();
    // expiresAt should be a native Date object (Postgres TIMESTAMPTZ)
    expect(verification!.expiresAt).toBeInstanceOf(Date);
    expect((verification!.expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
    // sanity check that numeric value is in milliseconds (greater than ~1e12)
    expect((verification!.expiresAt as Date).getTime()).toBeGreaterThan(1_000_000_000_000);

    const { getEmailVerificationRequestBy } =
      await import("$/server/crud/email-verification-request-crud");
    const found = await getEmailVerificationRequestBy({
      query: { userId: user.id },
      options: { limit: 1 },
    });
    expect(found.valid).toBe(true);
    // the DB value should be a Date object (Postgres TIMESTAMPTZ)
    expect(found.value[0].expiresAt).toBeInstanceOf(Date);
    expect((found.value[0].expiresAt as Date).getTime()).toBeGreaterThan(1_000_000_000_000);
  });

  it("createPasswordReset should create a password reset session with expiresAt as Date", async () => {
    const { createPasswordReset } = await import("$/server/email");

    const { addUser } = await import("$/server/crud/user-crud");
    const { createUser } = await import("./helpers/factories");
    const {
      valid,
      value: [user],
    } = await addUser([createUser()]);

    expect(valid).toBe(true);
    expect(user).toBeDefined();

    const reset = await createPasswordReset(user.id, user.email);
    expect(reset).not.toBeNull();
    // expiresAt should be a native Date object (Postgres TIMESTAMPTZ)
    expect(reset!.expiresAt).toBeInstanceOf(Date);
    expect((reset!.expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
    // sanity check that numeric value is in milliseconds (greater than ~1e12)
    expect((reset!.expiresAt as Date).getTime()).toBeGreaterThan(1_000_000_000_000);

    const { getPasswordResetSessionBy } = await import("$/server/crud/password-reset-session-crud");
    const found = await getPasswordResetSessionBy({
      query: { userId: user.id },
      options: { limit: 1 },
    });
    expect(found.valid).toBe(true);
    // the DB value should be a Date object (Postgres TIMESTAMPTZ)
    expect(found.value[0].expiresAt).toBeInstanceOf(Date);
    expect((found.value[0].expiresAt as Date).getTime()).toBeGreaterThan(1_000_000_000_000);
  });
});
