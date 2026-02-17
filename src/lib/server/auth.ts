import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { user, session } from "$lib/server/db/schema";
import { db } from "$/server/db";
import { getRequestEvent } from "$app/server";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { Session, SessionFlags } from "$/types/session";
import { omit } from "$/utils/mapper";
import { addSession, deleteSessionBy, updateSessionBy } from "./crud/session-crud";

export function requireAuth() {
  const { locals } = getRequestEvent();

  if (locals.user === null || locals.session === null) {
    return redirect(307, "/");
  }

  if (!locals.user.isOauthUser && !locals.user.emailVerified) {
    return redirect(302, "/auth?act=verify-email");
  }
  if (locals.user.registeredTwoFactor && !locals.session.twoFactorVerified) {
    return redirect(302, "/auth?act=2fa-checkpoint");
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
  const {
    value: [session],
  } = await addSession([
    {
      id: encodeHexLowerCase(sha256(new TextEncoder().encode(token))),
      userId,
      expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
      ...flags,
    },
  ]);

  return session;
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [result] = await db()
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

  let expiresAtMs = sessionResult.expiresAt.getTime();

  // delete expired sessions
  if (Date.now() >= expiresAtMs) {
    await invalidateSession(sessionId);
    return { session: null, user: null };
  }

  // renew session if it's within 15 days of expiry
  if (Date.now() >= expiresAtMs - DAY_IN_MS * 15) {
    const newExpires = new Date(Date.now() + DAY_IN_MS * 30);
    await updateSessionBy({ query: { id: sessionResult.id } }, { expiresAt: newExpires });
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
  await deleteSessionBy({ query: { id: sessionId } });
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
