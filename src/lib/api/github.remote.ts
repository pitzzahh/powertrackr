import { getRequestEvent, command } from "$app/server";
import { createGitHub } from "#lib/server/oauth.js";
import { randomBytes } from "node:crypto";
import { dev } from "$app/env";

export const loginWithGithub = command(async () => {
  const event = getRequestEvent();
  const state = randomBytes(32).toString("base64url");
  const url = createGitHub(event.url).createAuthorizationURL(state, ["user:email"]);

  event.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: !dev,
    path: "/",
    sameSite: "lax",
  });

  return { redirect: url.toString() };
});
