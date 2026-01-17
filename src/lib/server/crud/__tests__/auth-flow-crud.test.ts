import { describe, it, expect, beforeEach, vi } from "vitest";

let fakeLocals: any = { user: null, session: null };

// Mock $app/server.getRequestEvent to allow us to set locals dynamically per test.
vi.mock("$app/server", () => ({
  getRequestEvent: () => ({ locals: fakeLocals }),
}));

import { createSession, validateSessionToken, requireAuth } from "$/server/auth";

import { addUser } from "../user-crud";
import {
  addEmailVerificationRequest,
  getEmailVerificationRequestBy,
} from "../email-verification-request-crud";
import type { EmailVerificationRequestDTO } from "$/types/email-verification-request";

import { createUser, createEmailVerificationRequest, resetSequence } from "./helpers/factories";
import type { UserDTO } from "$/types/user";

describe("Auth Flow CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
    fakeLocals.user = null;
    fakeLocals.session = null;
  });

  it("email/password signup should require email verification", async () => {
    if (process.env.CI) return;
    // Create a non-OAuth user (no githubId) - typical email/password signup scenario
    const {
      valid: validUser,
      value: [user],
    } = await addUser([
      createUser({
        githubId: null,
        passwordHash: "hashed-password",
        emailVerified: false,
      }),
    ]);

    expect(validUser).toBe(true);
    expect(user).toBeDefined();

    // Simulate sending an email verification request (what the signup process should do)
    const verification = createEmailVerificationRequest({ userId: user.id, email: user.email });
    const addVerResult = await addEmailVerificationRequest([
      (() => {
        const { id: _, ...rest } = verification;
        return rest;
      })(),
    ]);
    expect(addVerResult.valid).toBe(true);

    // Ensure the verification request exists
    const found = await getEmailVerificationRequestBy({
      query: { userId: user.id },
      options: {},
    });
    expect(found.valid).toBe(true);
    expect(found.value.length).toBeGreaterThanOrEqual(1);
    const foundRow = found.value[0] as EmailVerificationRequestDTO;
    expect(foundRow.email).toBe(user.email);

    // Create a session for the user (mimics login immediately after signup)
    const token = `test-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const session = await createSession(token, user.id, {
      twoFactorVerified: false,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });
    expect(session).toBeDefined();
    expect(session.userId).toBe(user.id);

    // Validate the token to get the session & user shape as the app would see it
    const validated = await validateSessionToken(token);
    expect(validated.session).not.toBeNull();
    expect(validated.user).not.toBeNull();
    expect(validated.user!.emailVerified).toBe(false);
    const vUser = validated.user as UserDTO & { isOauthUser?: boolean };
    expect(vUser.isOauthUser).toBe(false);

    // Set locals for requireAuth and assert it redirects to verify-email for non-oauth unverified users
    fakeLocals.user = validated.user;
    fakeLocals.session = validated.session;

    let thrown: any = null;
    try {
      requireAuth();
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
    // requireAuth should redirect the user to the verify-email flow
    expect(thrown).toHaveProperty("location");
    expect(thrown.location).toBe("/auth?act=verify-email");
  });

  it("oauth signup should NOT require email verification", async () => {
    if (process.env.CI) return;
    // Create an OAuth user (githubId present) - OAuth flows shouldn't require email verification
    const {
      valid: validUser,
      value: [user],
    } = await addUser([createUser({ emailVerified: false, registeredTwoFactor: false })]);

    expect(validUser).toBe(true);
    expect(user).toBeDefined();

    // Create a session for this oauth user
    const token = `test-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const session = await createSession(token, user.id, {
      twoFactorVerified: false,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });
    expect(session).toBeDefined();
    expect(session.userId).toBe(user.id);

    // Validate session token
    const validated = await validateSessionToken(token);
    expect(validated.session).not.toBeNull();
    expect(validated.user).not.toBeNull();
    // Since user has a githubId, validateSessionToken exposes isOauthUser=true
    const vUser = validated.user as UserDTO & { isOauthUser?: boolean };
    expect(vUser.isOauthUser).toBe(true);
    // Email verification is irrelevant for oauth users in requireAuth
    expect(validated.user!.emailVerified).toBe(false);

    // Set locals and requireAuth should NOT redirect; instead return the session & user
    fakeLocals.user = validated.user;
    fakeLocals.session = validated.session;

    const result = requireAuth();
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.user.id).toBe(user.id);
    expect(result.session.id).toBe(session.id);
  });
});
