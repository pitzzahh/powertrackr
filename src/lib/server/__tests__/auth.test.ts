import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks that need to be available before importing the module under test
const mockGetRequestEvent = vi.fn();

// Mock $app/server getRequestEvent so requireAuth reads our locals
vi.mock("$app/server", () => ({
  getRequestEvent: () => mockGetRequestEvent(),
}));

// Simple redirect mock so requireAuth returns a plain value we can assert
vi.mock("@sveltejs/kit", () => ({
  redirect: (status: number, location: string) => ({ status, location }),
}));

import { db } from "$/server/db";
import { user, session } from "$/server/db/schema";
import { eq } from "drizzle-orm";

// Import the module under test after setting up the mocks
import {
  requireAuth,
  createSession,
  validateSessionToken,
  invalidateSession,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
  sessionCookieName,
} from "$/server/auth";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

describe("auth module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("requireAuth redirects to login when no user or session", () => {
    mockGetRequestEvent.mockImplementation(() => ({ locals: { user: null, session: null } }));
    const res = requireAuth();
    expect(res).toEqual({ status: 307, location: "/auth?act=login" });
  });

  it("requireAuth redirects to verify-email when email not verified", () => {
    mockGetRequestEvent.mockImplementation(() => ({
      locals: {
        user: { isOauthUser: false, emailVerified: false, registeredTwoFactor: false },
        session: {},
      },
    }));
    const res = requireAuth();
    expect(res).toEqual({ status: 302, location: "/auth?act=verify-email" });
  });

  it("requireAuth redirects to 2fa setup when user has registered two factor", () => {
    mockGetRequestEvent.mockImplementation(() => ({
      locals: {
        user: { isOauthUser: true, emailVerified: true, registeredTwoFactor: true },
        session: { twoFactorVerified: true },
      },
    }));
    const res = requireAuth();
    expect(res).toEqual({ status: 302, location: "/auth?act=2fa-setup" });
  });

  it("requireAuth returns user and session on success", () => {
    const user = {
      id: "u1",
      email: "a@b.com",
      name: "A",
      image: null,
      emailVerified: true,
      registeredTwoFactor: false,
      githubId: null,
    };
    const session = { id: "s1", twoFactorVerified: true };
    mockGetRequestEvent.mockImplementation(() => ({ locals: { user, session } }));
    const res = requireAuth();
    expect(res).toEqual({ user, session });
  });

  it("createSession inserts into DB and returns created session", async () => {
    if (process.env.CI) return;
    const token = "token-1";
    const userId = "user-1";

    // Ensure user exists (session has a FK to user)
    await db
      .insert(user)
      .values({
        id: userId,
        name: "A",
        email: "a@b.com",
        emailVerified: true,
        registeredTwoFactor: false,
      })
      .returning();

    const flags = { twoFactorVerified: false } as any;

    const sess = await createSession(token, userId, flags);
    expect(sess.userId).toBe(userId);
    expect(sess.expiresAt).toBeInstanceOf(Date);

    // Verify session exists in DB
    const rows = await db.select().from(session).where(eq(session.id, sess.id));
    expect(rows.length).toBeGreaterThan(0);
  });

  it("validateSessionToken returns nulls when session not found", async () => {
    const res = await validateSessionToken("nope");
    expect(res).toEqual({ session: null, user: null });
  });

  it("validateSessionToken deletes expired sessions and returns nulls", async () => {
    if (process.env.CI) return;
    const userId = "u1";
    await db
      .insert(user)
      .values({
        id: userId,
        name: "Expired User",
        email: "aa",
        emailVerified: true,
        registeredTwoFactor: false,
      })
      .returning();

    const token = "token-expired";
    const sess = await createSession(token, userId, { twoFactorVerified: false } as any);

    // Expire the session
    await db
      .update(session)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(session.id, sess.id));

    const res = await validateSessionToken(token);
    expect(res).toEqual({ session: null, user: null });

    // Ensure session removed from DB
    const rows = await db.select().from(session).where(eq(session.id, sess.id));
    expect(rows.length).toBe(0);
  });

  it("validateSessionToken renews sessions close to expiry", async () => {
    if (process.env.CI) return;
    const userId = "u2";
    await db
      .insert(user)
      .values({
        id: userId,
        name: "B",
        email: "bb",
        emailVerified: true,
        registeredTwoFactor: false,
        githubId: 123,
      })
      .returning();

    const token = "token-renew";
    const sess = await createSession(token, userId, { twoFactorVerified: false } as any);

    // Set near expiry (~10 days from now)
    const nearExpiry = new Date(Date.now() + DAY_IN_MS * 10);
    await db.update(session).set({ expiresAt: nearExpiry }).where(eq(session.id, sess.id));

    const res = await validateSessionToken(token);

    // verify that expiresAt was updated to a later date
    expect(res.session).toBeTruthy();
    expect(res.session?.expiresAt).toBeInstanceOf(Date);
    expect((res.session as any).expiresAt.getTime()).toBeGreaterThan(nearExpiry.getTime());

    // user should have isOauthUser derived from githubId and githubId omitted
    expect(res.user).toEqual(expect.objectContaining({ isOauthUser: true }));
    expect((res.user as any).githubId).toBeUndefined();

    // also verify DB has updated expiration
    const [dbRow] = await db.select().from(session).where(eq(session.id, sess.id));
    expect(dbRow.expiresAt.getTime()).toBeGreaterThan(nearExpiry.getTime());
  });

  it("invalidateSession calls delete on db", async () => {
    if (process.env.CI) return;
    const userId = "u3";
    await db
      .insert(user)
      .values({ id: userId, name: "C", email: "c@d.com", emailVerified: true })
      .returning();
    const token = "to-delete";
    const sess = await createSession(token, userId, { twoFactorVerified: false } as any);

    // Ensure session exists
    let rows = await db.select().from(session).where(eq(session.id, sess.id));
    expect(rows.length).toBeGreaterThan(0);

    await invalidateSession(sess.id);

    rows = await db.select().from(session).where(eq(session.id, sess.id));
    expect(rows.length).toBe(0);
  });

  it("setSessionTokenCookie and deleteSessionTokenCookie interact with cookies API", () => {
    const setSpy = vi.fn();
    const deleteSpy = vi.fn();
    const fakeEvent: any = { cookies: { set: setSpy, delete: deleteSpy } };
    const token = "tok";
    const expiresAt = new Date(Date.now() + DAY_IN_MS);

    setSessionTokenCookie(fakeEvent as any, token, expiresAt);
    expect(setSpy).toHaveBeenCalledWith(sessionCookieName, token, {
      expires: expiresAt,
      path: "/",
      sameSite: "strict",
    });

    deleteSessionTokenCookie(fakeEvent as any);
    expect(deleteSpy).toHaveBeenCalledWith(sessionCookieName, { path: "/" });
  });

  it("sessionCookieName constant is exported", () => {
    expect(sessionCookieName).toBe("auth-session");
  });
});
