import * as auth from "$lib/server/auth";
import { sequence } from "@sveltejs/kit/hooks";
import { dev } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

const handleAuth: Handle = async ({ event, resolve }) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.headers.get("connection")?.toLowerCase().includes("upgrade") &&
    request.headers.get("upgrade")?.toLowerCase() === "websocket" &&
    url.pathname.startsWith("/ws")
  ) {
    console.log("upgrading");
    // We must use the platform.request here
    await event.platform!.server.upgrade(event.platform!.request);
    return new Response(null, { status: 101 });
  }

  // Skip auth checks for auth-related paths and root landing page
  if (
    event.url.pathname.startsWith("/auth") ||
    event.url.pathname === "/" ||
    event.url.pathname.startsWith("/events")
  ) {
    return resolve(event);
  }

  // Require authentication for other paths
  if (!event.locals.user || !event.locals.session) {
    redirect(307, "/");
  }

  // Check additional auth requirements
  if (!event.locals.user.isOauthUser && !event.locals.user.emailVerified) {
    redirect(303, "/auth?act=verify-email");
  }
  if (event.locals.user.registeredTwoFactor && !event.locals.session.twoFactorVerified) {
    redirect(303, "/auth?act=2fa-checkpoint");
  }

  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

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

export const websocket: Bun.WebSocketHandler<undefined> = {
  async open(ws) {
    console.log("WebSocket opened");
    ws.send("Hello WebSocket");
  },
  message(ws, message) {
    console.log("WebSocket message received");
    ws.send(message);
  },
  close() {
    console.log("WebSocket closed");
  },
};

export const handle = sequence(handleAuth, handleDevTools, log);
