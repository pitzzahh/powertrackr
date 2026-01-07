import { ObjectParser } from "@pilcrowjs/object-parser";
import { getUserFromGitHubId } from "$/api/user.remote";
import { createSession, setSessionTokenCookie } from "$/server/auth";

import type { OAuth2Tokens } from "arctic";
import type { RequestEvent } from "./$types";
import { generateSessionToken } from "$/server/encryption";
import { createGitHub } from "$/server/oauth";
import { addUser } from "$/server/crud/user-crud";

// TODO: oauth param check to call correct callback
export async function GET(event: RequestEvent): Promise<Response> {
  const storedState = event.cookies.get("github_oauth_state") ?? null;
  const code = event.url.searchParams.get("code");
  const state = event.url.searchParams.get("state");

  if (storedState === null || code === null || state === null) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }
  if (storedState !== state) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await createGitHub(event.url).validateAuthorizationCode(code);
  } catch (e) {
    return new Response("Please restart the process.", {
      status: 400,
      statusText: e instanceof Error ? e.message : "Please restart the process.",
    });
  }

  const githubAccessToken = tokens.accessToken();

  const userRequest = new Request("https://api.github.com/user");
  userRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const userResponse = await event.fetch(userRequest);
  const userResult: unknown = await userResponse.json();
  const userParser = new ObjectParser(userResult);

  const githubUserId = userParser.getNumber("id");
  const username = userParser.getString("login");
  const name = userParser.getString("name");

  const {
    valid,
    value: [existingUser],
  } = await getUserFromGitHubId(githubUserId);
  if (valid && existingUser) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, existingUser["id"] as string, {
      twoFactorVerified: false,
      ipAddress: event.getClientAddress(),
      userAgent: event.request.headers.get("user-agent"),
    });
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const emailListRequest = new Request("https://api.github.com/user/emails");
  emailListRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const emailListResponse = await fetch(emailListRequest);
  const emailListResult: unknown = await emailListResponse.json();
  if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }
  let email: string | null = null;
  for (const emailRecord of emailListResult) {
    const emailParser = new ObjectParser(emailRecord);
    const primaryEmail = emailParser.getBoolean("primary");
    const verifiedEmail = emailParser.getBoolean("verified");
    if (primaryEmail && verifiedEmail) {
      email = emailParser.getString("email");
    }
  }
  if (email === null) {
    return new Response("Please verify your GitHub email address.", {
      status: 400,
    });
  }

  const {
    value: [user],
  } = await addUser([
    {
      githubId: githubUserId,
      email,
      name: name || username,
      image: userParser.getString("avatar_url") || null,
    },
  ]);
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, session.expiresAt);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}
