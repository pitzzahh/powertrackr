import { getRequestEvent, command } from "$app/server";
import { createGitHub } from "$/server/oauth";
import { generateState } from "arctic";
import { dev } from "$app/environment";

export const loginWithGithub = command(async () => {
  const event = getRequestEvent();
  const state = generateState();
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
