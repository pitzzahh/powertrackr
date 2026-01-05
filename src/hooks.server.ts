import * as auth from "$lib/server/auth";
import { sequence } from "@sveltejs/kit/hooks";
import { dev } from "$app/environment";
import type { Handle } from "@sveltejs/kit";

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;

    return resolve(event);
  }
  try {
    const { session, user } = await auth.validateSessionToken(sessionToken);

    if (session) {
      auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
    } else {
      auth.deleteSessionTokenCookie(event);
    }

    event.locals.user = user;
    event.locals.session = session;
  } catch {
    event.locals.user = null;
    event.locals.session = null;
  }
  return resolve(event);
};

export const handleDevTools: Handle = async ({ event, resolve }) => {
  if (
    dev &&
    event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
  ) {
    return new Response(undefined, { status: 404 });
  }

  return resolve(event);
};

export const log: Handle = async ({ event, resolve }) => {
  const {
    request: { method },
    url: { pathname, origin },
  } = event;
  console.info(
    `${new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true })} | ${method} | ${origin}${pathname}`,
  );

  return resolve(event);
};

export const handle = sequence(handleDevTools, handleAuth, log);
