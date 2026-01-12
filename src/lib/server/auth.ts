import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { user, session } from "$lib/server/db/schema";
import { db } from "$/server/db";
import { getRequestEvent } from "$app/server";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { Session, SessionFlags } from "$/types/session";

export function requireAuth() {
  const { locals } = getRequestEvent();

  if (locals.user === null || locals.session === null) {
    return redirect(307, "/auth?act=login");
  }

  if (!locals.user.emailVerified) {
    return redirect(302, "/auth/verify-email");
  }
  if (locals.user.registeredTwoFactor) {
    return redirect(302, "/auth/2fa/setup");
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
  const [sess] = await db
    .insert(session)
    .values({
      id: encodeHexLowerCase(sha256(new TextEncoder().encode(token))),
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
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

  // delete expired sessions
  if (Date.now() >= sessionResult.expiresAt.getTime()) {
    await db.delete(session).where(eq(session.id, session.id));
    return { session: null, user: null };
  }

  // renew session if it's within 15 days of expiry
  if (Date.now() >= sessionResult.expiresAt.getTime() - DAY_IN_MS * 15) {
    sessionResult.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(session.id, session.id));
  }

  return { session: sessionResult, user: userResult };
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
