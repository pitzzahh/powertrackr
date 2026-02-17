import * as auth from "$lib/server/auth";
import { sequence } from "@sveltejs/kit/hooks";
import { dev } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
  } else {
    try {
      const { session, user } = await auth.validateSessionToken(sessionToken);

      if (session) {
        auth.setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));
      } else {
        auth.deleteSessionTokenCookie(event);
      }

      event.locals.user = user;
      event.locals.session = session;
    } catch (error) {
      console.error("Auth error:", error);
      event.locals.user = null;
      event.locals.session = null;
    }
  }

  // Skip auth checks for auth-related paths and root landing page
  if (event.url.pathname.startsWith("/auth") || event.url.pathname === "/") {
    return resolve(event);
  }

  // Require authentication for other paths
  if (!event.locals.user || !event.locals.session) {
    redirect(307, "/");
  }

  // Check additional auth requirements
  if (!event.locals.user.isOauthUser && !event.locals.user.emailVerified) {
    redirect(302, "/auth?act=verify-email");
  }
  if (event.locals.user.registeredTwoFactor && !event.locals.session.twoFactorVerified) {
    redirect(302, "/auth/2fa");
  }

  return resolve(event);
};

export const handleDevTools: Handle = async ({ event, resolve }) => {
  if (dev && event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
    return new Response(undefined, { status: 404 });
  }

  return resolve(event);
};

export const log: Handle = async ({ event, resolve }) => {
  const {
    request: { method },
    url: { pathname, origin },
    locals: { user, session },
  } = event;

  console.info(
    `[${user && session ? "Authenticated" : "Unauthenticated"}] ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true })} | ${method} | ${origin}${pathname}`
  );

  return resolve(event);
};

export const handle = sequence(handleAuth, handleDevTools, log);
