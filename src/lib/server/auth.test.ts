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

vi.mock("$/server/db", () => {
  const insert = vi.fn();
  const select = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  return { db: { insert, select, update, delete: del } };
});
import { db as mockDb } from "$/server/db";

// Import the module under test after setting up the mocks
import {
  requireAuth,
  createSession,
  validateSessionToken,
  invalidateSession,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
  sessionCookieName,
} from "./auth";

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
    // Mock insert to return back the values object as the inserted row
    (mockDb.insert as any).mockImplementation(() => ({
      values: (v: any) => ({ returning: vi.fn(async () => [v]) }),
    }));

    const token = "token-1";
    const userId = "user-1";
    const flags = { twoFactorVerified: false } as any;

    const sess = await createSession(token, userId, flags);
    expect(sess.userId).toBe(userId);
    expect(typeof sess.expiresAt).toBe("string");
    // Ensure insert was called
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("validateSessionToken returns nulls when session not found", async () => {
    // select -> return empty
    (mockDb.select as any).mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({ where: () => Promise.resolve([]) }),
      }),
    }));

    const res = await validateSessionToken("nope");
    expect(res).toEqual({ session: null, user: null });
  });

  it("validateSessionToken deletes expired sessions and returns nulls", async () => {
    const expired = new Date(Date.now() - 1000).toISOString();
    const sessionRow = { id: "sid", userId: "u1", expiresAt: expired };
    const userRow = {
      id: "u1",
      email: "aa",
      name: null,
      image: null,
      emailVerified: true,
      registeredTwoFactor: false,
      githubId: null,
    };

    (mockDb.select as any).mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve([{ session: sessionRow, user: userRow }]),
        }),
      }),
    }));

    const mockWhere = vi.fn(() => Promise.resolve());
    (mockDb.delete as any).mockImplementation(() => ({ where: mockWhere }));

    const res = await validateSessionToken("token-expired");
    expect(res).toEqual({ session: null, user: null });
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("validateSessionToken renews sessions close to expiry", async () => {
    const nearExpiry = new Date(Date.now() + DAY_IN_MS * 10).toISOString(); // 10 days from now
    const sessionRow: any = {
      id: "sid2",
      userId: "u2",
      expiresAt: nearExpiry,
      twoFactorVerified: false,
    };
    const userRow = {
      id: "u2",
      email: "bb",
      name: "B",
      image: null,
      emailVerified: true,
      registeredTwoFactor: false,
      githubId: "gh",
    };

    (mockDb.select as any).mockImplementation(() => ({
      from: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve([{ session: sessionRow, user: userRow }]),
        }),
      }),
    }));

    let capturedSet: any = null;
    const mockWhereUpdate = vi.fn(() => Promise.resolve());
    (mockDb.update as any).mockImplementation(() => ({
      set: (obj: any) => {
        capturedSet = obj;
        return { where: mockWhereUpdate };
      },
    }));

    const res = await validateSessionToken("token-renew");
    expect(mockDb.update).toHaveBeenCalled();
    expect(capturedSet).toBeTruthy();
    expect(typeof capturedSet.expiresAt).toBe("string");
    expect(Date.parse(capturedSet.expiresAt)).toBeGreaterThan(Date.parse(nearExpiry));
    // returned session.expiresAt is updated accordingly
    expect(res.session?.expiresAt).toBe(capturedSet.expiresAt);
    // user should have isOauthUser derived from githubId and githubId omitted
    expect(res.user).toEqual(expect.objectContaining({ isOauthUser: true }));
    expect((res.user as any).githubId).toBeUndefined();
  });

  it("invalidateSession calls delete on db", async () => {
    const mockWhere = vi.fn(() => Promise.resolve());
    (mockDb.delete as any).mockImplementation(() => ({ where: mockWhere }));
    await invalidateSession("some-id");
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
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
