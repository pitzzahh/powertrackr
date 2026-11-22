import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRedirect, isValidationError, isHttpError } from "@sveltejs/kit";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { TOTP, Secret } from "otpauth";
import { eq } from "drizzle-orm";

const state = vi.hoisted(() => ({
  event: null as unknown,
  env: {} as Record<string, unknown>,
}));

vi.mock("$app/server", async () => {
  const { remoteServerMock } =
    await import("#lib/server/crud/__tests__/helpers/remote-handlers.js");
  return remoteServerMock(() => state.event);
});
vi.mock("cloudflare:workers", () => ({
  get env() {
    return state.env;
  },
}));

import { verify2FA, resetPassword, checkpoint2FA, changePassword } from "#lib/api/auth.remote.js";
import { updateUser, deleteUser } from "#lib/api/user.remote.js";
import { hashPassword } from "#lib/server/encryption.js";
import { createBillingInfoLogic } from "#lib/server/crud/billing-logic.js";
import { addUser } from "#lib/server/crud/user-crud.js";
import { addSession } from "#lib/server/crud/session-crud.js";
import { addPasswordResetSession } from "#lib/server/crud/password-reset-session-crud.js";
import { db } from "#lib/server/db/index.js";
import { session as sessionTable, user as userTable } from "#lib/server/db/schema/index.js";
import {
  createUser,
  createSession,
  createTenantUser,
} from "#lib/server/crud/__tests__/helpers/factories.js";
import { issues, makeEvent } from "#lib/server/crud/__tests__/helpers/remote-handlers.js";

type Handler = (data: unknown, issues: unknown) => Promise<unknown>;

async function seedSignedIn(opts: { registeredTwoFactor: boolean; twoFactorVerified: boolean }) {
  const {
    value: [u],
  } = await addUser([
    createUser({
      githubId: null,
      emailVerified: true,
      registeredTwoFactor: opts.registeredTwoFactor,
    }),
  ]);
  const {
    value: [s],
  } = await addSession([
    createSession({ userId: u.id, twoFactorVerified: opts.twoFactorVerified }),
  ]);
  state.event = makeEvent({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      image: null,
      emailVerified: true,
      registeredTwoFactor: opts.registeredTwoFactor,
      ownerId: null,
      isOauthUser: false,
    },
    session: s,
  });
  return { user: u, session: s };
}

function totpFor(secret: Uint8Array) {
  return new TOTP({
    secret: new Secret({ buffer: Uint8Array.from(secret).buffer }),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  }).generate();
}

beforeEach(() => {
  state.env = {};
});

describe("verify2FA", () => {
  it("refuses a session that has not passed the 2FA checkpoint (no secret swap)", async () => {
    const { user } = await seedSignedIn({ registeredTwoFactor: true, twoFactorVerified: false });
    const secret = crypto.getRandomValues(new Uint8Array(20));

    const attempt = (verify2FA as unknown as Handler)(
      { code: totpFor(secret), secret: encodeBase32UpperCaseNoPadding(secret) },
      issues
    );

    await expect(attempt).rejects.toSatisfy(
      (e) => isRedirect(e) && e.location === "/auth?act=2fa-checkpoint"
    );
    const [row] = await db().select().from(userTable).where(eq(userTable.id, user.id));
    expect(row.totpKey).toBeNull();
  });

  it("refuses to overwrite an already enabled 2FA", async () => {
    await seedSignedIn({ registeredTwoFactor: true, twoFactorVerified: true });
    const secret = crypto.getRandomValues(new Uint8Array(20));

    await expect(
      (verify2FA as unknown as Handler)(
        { code: totpFor(secret), secret: encodeBase32UpperCaseNoPadding(secret) },
        issues
      )
    ).rejects.toSatisfy((e) => isHttpError(e) && e.status === 400);
  });
});

describe("checkpoint2FA", () => {
  it("stops guessing once the rate limit is hit", async () => {
    await seedSignedIn({ registeredTwoFactor: true, twoFactorVerified: false });
    state.env = { LOGIN_RATE_LIMITER: { limit: async () => ({ success: false }) } };

    await expect(
      (checkpoint2FA as unknown as Handler)({ code: "123456" }, issues)
    ).rejects.toSatisfy(
      (e) => isValidationError(e) && e.issues[0]?.message.startsWith("Too many attempts")
    );
  });
});

describe("resetPassword", () => {
  it("answers an unknown code with a field error, not a crash", async () => {
    state.event = makeEvent({ user: null, session: null });

    await expect(
      (resetPassword as unknown as Handler)(
        { code: "NOPE1234", _password: "new-password", _confirmPassword: "new-password" },
        issues
      )
    ).rejects.toSatisfy((e) => isValidationError(e) && e.issues[0]?.path?.[0] === "code");
  });

  it("signs out every session of the user", async () => {
    const { user } = await seedSignedIn({ registeredTwoFactor: false, twoFactorVerified: false });
    await addPasswordResetSession([
      {
        userId: user.id,
        email: user.email,
        code: "RESETCODE",
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);
    state.event = makeEvent({ user: null, session: null });

    await expect(
      (resetPassword as unknown as Handler)(
        { code: "RESETCODE", _password: "new-password", _confirmPassword: "new-password" },
        issues
      )
    ).rejects.toSatisfy((e) => isRedirect(e) && e.location === "/auth?act=login");

    const sessions = await db().select().from(sessionTable).where(eq(sessionTable.userId, user.id));
    expect(sessions).toHaveLength(0);
  });
});

describe("changePassword", () => {
  it("signs out every other session and keeps the current one", async () => {
    const { user, session } = await seedSignedIn({
      registeredTwoFactor: false,
      twoFactorVerified: false,
    });
    await db()
      .update(userTable)
      .set({ passwordHash: await hashPassword("old-password") })
      .where(eq(userTable.id, user.id));
    await addSession([createSession({ userId: user.id })]);

    await (changePassword as unknown as Handler)(
      {
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
      },
      issues
    );

    const sessions = await db().select().from(sessionTable).where(eq(sessionTable.userId, user.id));
    expect(sessions.map((s) => s.id)).toEqual([session.id]);
  });
});

describe("updateUser", () => {
  it("an OAuth email change must be verified again", async () => {
    const { user } = await seedSignedIn({ registeredTwoFactor: false, twoFactorVerified: false });
    const locals = (state.event as { locals: { user: { isOauthUser: boolean } } }).locals;
    locals.user.isOauthUser = true;

    await (updateUser as unknown as Handler)({ email: "new-address@example.com" }, issues);

    const [row] = await db().select().from(userTable).where(eq(userTable.id, user.id));
    expect(row).toMatchObject({ email: "new-address@example.com", emailVerified: false });
  });
});

describe("deleteUser", () => {
  it("refuses a tenant whose readings are on the owner's bills", async () => {
    const {
      value: [owner],
    } = await addUser([createUser({ githubId: null, emailVerified: true })]);
    const {
      value: [tenant],
    } = await addUser([createTenantUser(owner.id, { githubId: null, emailVerified: true })]);
    await createBillingInfoLogic(
      {
        date: "2026-09-01",
        totalkWh: 200,
        balance: 2000,
        status: "pending",
        subMeters: [{ tenantUserId: tenant.id, reading: 50, status: "pending" }],
      },
      owner.id
    );
    const {
      value: [s],
    } = await addSession([createSession({ userId: tenant.id })]);
    state.event = makeEvent({
      user: {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        image: null,
        emailVerified: true,
        registeredTwoFactor: false,
        ownerId: owner.id,
        isOauthUser: false,
      },
      session: s,
    });

    await expect(
      (deleteUser as unknown as Handler)({ id: tenant.id, confirmEmail: tenant.email }, issues)
    ).rejects.toSatisfy((e) => isValidationError(e));
    const rows = await db().select().from(userTable).where(eq(userTable.id, tenant.id));
    expect(rows).toHaveLength(1);
  });
});
