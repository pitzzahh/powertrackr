import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { db } from "$/server/db";
import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  plugins: [sveltekitCookies(getRequestEvent)],
  emailAndPassword: { enabled: true },
});

export function requireAuth() {
  const { locals } = getRequestEvent();

  if (!locals.user) {
    redirect(307, "/auth/login");
  }

  return locals.user;
}
