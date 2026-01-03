import { loginSchema } from "$/schemas/auth";
import {
  createSession,
  deleteSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
} from "$/server/auth";
import { getUserBy } from "$/server/crud/user-crud";
import { generateSessionToken, verifyPasswordHash } from "$/server/encryption";
import type { HelperResult } from "$/types/helper";
import type { SessionFlags } from "$/types/session";
import type { NewUser } from "$/types/user";
import { form, getRequestEvent } from "$app/server";
import { fail, redirect } from "@sveltejs/kit";

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return fail(401);
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  throw redirect(303, "/auth");
});

export const login = form(loginSchema, async (user) => {
  const event = getRequestEvent();
  const { email, password } = user;
  if (typeof email !== "string" || typeof password !== "string") {
    return fail(400, {
      message: "Invalid or missing fields",
      email: "",
    });
  }
  if (email === "" || password === "") {
    return fail(400, {
      message: "Please enter your email and password.",
      email,
    });
  }
  const {
    value: [userResult],
  } = (await getUserBy({
    query: {
      email,
    },
    options: {
      with_session: false,
    },
  })) as HelperResult<NewUser[]>;

  if (userResult === null) {
    return fail(400, {
      message: "Account does not exist",
      email,
    });
  }

  const validPassword = await verifyPasswordHash(
    userResult.passwordHash || "",
    password,
  );
  if (!validPassword) {
    return fail(400, {
      message: "Invalid password",
      email,
    });
  }

  const sessionFlags: SessionFlags = {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  };

  const sessionToken = generateSessionToken();
  const session = await createSession(
    sessionToken,
    userResult.id,
    sessionFlags,
  );
  setSessionTokenCookie(event, sessionToken, session.expiresAt);

  // TODO: Fix redirects
  if (!userResult.emailVerified) {
    return redirect(302, "/verify-email");
  }
  if (!userResult.registeredTwoFactor) {
    return redirect(302, "/2fa/setup");
  }
  return redirect(302, "/2fa");
});
