import { betterAuth, type User, type Session } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { db } from "$/server/db";
import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "$env/static/private";
import { dev } from "$app/environment";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  plugins: [sveltekitCookies(getRequestEvent)],
  emailAndPassword: { enabled: true },
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  telemetry: { enabled: false, debug: dev },
});

export function requireAuth(): App.Locals {
  const { locals } = getRequestEvent();

  if (!locals.user && !locals.session) {
    redirect(307, "/auth?act=login");
  }

  return {
    user: locals.user as User,
    session: locals.session as Session,
  };
}
