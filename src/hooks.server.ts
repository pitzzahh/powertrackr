import { redirect } from "@sveltejs/kit";
import * as auth from "#lib/server/auth.js";
import { sequence, type Handle } from "@sveltejs/kit/hooks";
import { dev } from "$app/env";
import { isPublicPathname } from "#lib/utils/constant.js";

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

  // Skip auth checks for public paths
  if (isPublicPathname(event.url.pathname)) {
    return resolve(event);
  }

  // Remote function calls (/_app/remote/*) enforce their own auth inside each
  // handler (see src/lib/api/*.remote.ts); the request-level redirects below
  // apply to page navigations only. They must not intercept remote calls:
  // login/register are anonymous by design, and 2FA-pending users need to reach
  // getCurrentUser (landing nav) and checkpoint2FA. `isRemoteRequest` is
  // SvelteKit's sanctioned signal for this distinction.
  if (event.isRemoteRequest) {
    return resolve(event);
  }

  // Require authentication for other paths
  if (!event.locals.user || !event.locals.session) {
    redirect(307, "/auth?act=login");
  }

  // Check additional auth requirements
  if (!event.locals.user.isOauthUser && !event.locals.user.emailVerified) {
    redirect(303, "/auth?act=verify-email");
  }
  if (event.locals.user.registeredTwoFactor && !event.locals.session.twoFactorVerified) {
    redirect(303, "/auth?act=2fa-checkpoint");
  }

  // Tenant accounts only ever see the tenant area
  if (
    event.locals.user.ownerId &&
    !event.url.pathname.startsWith("/tenant") &&
    !isPublicPathname(event.url.pathname)
  ) {
    redirect(307, "/tenant");
  }

  return resolve(event);
};

export const handleDevTools: Handle = async ({ event, resolve }) => {
  if (dev && event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
    return new Response(undefined, { status: 404 });
  }

  return resolve(event);
};

// Per-request request logging is dev-only: the `toLocaleString()` call plus
// `console.info` add measurable CPU on every production request (including
// every `$app/server` RPC call), while observability logs are disabled in
// wrangler.toml anyway. `dev` is a compile-time constant, so this block is
// eliminated from production builds.
export const log: Handle = async ({ event, resolve }) => {
  if (!dev) return resolve(event);

  const {
    request: { method },
    url,
    locals: { user, session },
  } = event;

  console.info(
    `[${user && session ? "Authenticated" : "Unauthenticated"}] ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true })} | [${method}]: ${url}`
  );

  return resolve(event);
};

export const handleHSTS: Handle = async ({ event, resolve }) => {
  event.setHeaders({
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  });
  return resolve(event);
};

export const handle = sequence(handleHSTS, handleAuth, handleDevTools, log);
