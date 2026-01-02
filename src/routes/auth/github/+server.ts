import { createGitHub } from "$lib/server/oauth";
import { generateState } from "arctic";
import type { RequestEvent } from "./$types";
import { dev } from "$app/environment";

export function GET(event: RequestEvent): Response {
  const state = generateState();
  const url = createGitHub(event.url).createAuthorizationURL(state, [
    "user:email",
  ]);

  event.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: !dev,
    path: "/",
    sameSite: "lax",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}
