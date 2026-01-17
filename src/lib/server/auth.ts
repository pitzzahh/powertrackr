import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { user, session } from "$lib/server/db/schema";
import { db } from "$/server/db";
import { getRequestEvent } from "$app/server";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { Session, SessionFlags } from "$/types/session";
import { omit } from "$/utils/mapper";

export function requireAuth() {
  const { locals } = getRequestEvent();

  if (locals.user === null || locals.session === null) {
    return redirect(307, "/auth?act=login");
  }

  if (!locals.user.isOauthUser && !locals.user.emailVerified) {
    return redirect(302, "/auth?act=verify-email");
  }
  if (locals.user.registeredTwoFactor) {
    return redirect(302, "/auth?act=2fa-setup");
  }
  if (locals.user.registeredTwoFactor && !locals.session.twoFactorVerified) {
    return redirect(302, "/auth/2fa");
  }

  return {
    user: locals.user,
    session: locals.session,
  };
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = "auth-session";

export async function createSession(
  token: string,
  userId: string,
  flags: SessionFlags
): Promise<Session> {
  // Create an ISO string for the DB (store dates as ISO strings). We return
  // a Session object with `expiresAt` as a Date to preserve existing runtime
  // expectations for callers.
  const [sess] = await db
    .insert(session)
    .values({
      id: encodeHexLowerCase(sha256(new TextEncoder().encode(token))),
      userId,
      expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
      ...flags,
    })
    .returning();

  return sess;
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [result] = await db
    .select({
      // Adjust user table here to tweak returned data
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        registeredTwoFactor: user.registeredTwoFactor,
        githubId: user.githubId,
      },
      session: session,
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, sessionId));

  if (!result) {
    return { session: null, user: null };
  }
  const { session: sessionResult, user: userResult } = result;

  // Normalize the stored expiresAt into milliseconds (do NOT mutate
  // `sessionResult.expiresAt`). Supports Date, ISO strings (TEXT) or numeric
  // timestamps (seconds or milliseconds).
  let expiresAtMs = 0;
  if (sessionResult.expiresAt instanceof Date) {
    expiresAtMs = sessionResult.expiresAt.getTime();
  } else if (typeof sessionResult.expiresAt === "string") {
    expiresAtMs = Date.parse(sessionResult.expiresAt);
  } else if (typeof sessionResult.expiresAt === "number") {
    const raw = sessionResult.expiresAt as number;
    expiresAtMs = raw < 1_000_000_000_000 ? raw * 1000 : raw;
  } else {
    // last-resort coercion: accept other representations (e.g., stringified)
    const asNumber = Number((sessionResult.expiresAt as any) ?? NaN);
    if (!Number.isNaN(asNumber)) {
      expiresAtMs = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    } else {
      const asString = sessionResult.expiresAt ? String(sessionResult.expiresAt as any) : "";
      expiresAtMs = asString ? Date.parse(asString) : 0;
    }
  }

  // delete expired sessions
  if (Date.now() >= expiresAtMs) {
    await db.delete(session).where(eq(session.id, session.id));
    return { session: null, user: null };
  }

  // renew session if it's within 15 days of expiry
  if (Date.now() >= expiresAtMs - DAY_IN_MS * 15) {
    const newExpires = new Date(Date.now() + DAY_IN_MS * 30);
    await db.update(session).set({ expiresAt: newExpires }).where(eq(session.id, session.id));
    // reflect the updated expiresAt as a Date in the returned session object
    sessionResult.expiresAt = newExpires;
  }

  return {
    session: sessionResult,
    user: omit(
      {
        ...userResult,
        isOauthUser: Boolean(userResult.githubId),
      },
      ["githubId"]
    ),
  };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
  await db.delete(session).where(eq(session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
  event.cookies.set(sessionCookieName, token, {
    expires: expiresAt,
    path: "/",
    sameSite: "strict",
  });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
  event.cookies.delete(sessionCookieName, {
    path: "/",
  });
}
