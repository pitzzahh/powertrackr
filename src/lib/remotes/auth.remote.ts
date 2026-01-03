import { loginSchema, registerSchema } from "$/schemas/auth";
import {
  createSession,
  deleteSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
} from "$/server/auth";
import { addUser, getUserBy } from "$/server/crud/user-crud";
import {
  encryptString,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "$/server/encryption";
import type { HelperResult } from "$/types/helper";
import type { SessionFlags } from "$/types/session";
import type { NewUser } from "$/types/user";
import { form, getRequestEvent } from "$app/server";
import { error, redirect } from "@sveltejs/kit";

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return error(401, "Not authenticated");
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  redirect(303, "/auth");
});

export const login = form(loginSchema, async (user) => {
  const event = getRequestEvent();
  const { email, password } = user;
  if (typeof email !== "string" || typeof password !== "string") {
    return error(400, "Invalid or missing fields");
  }
  if (email === "" || password === "") {
    return error(400, "Please enter your email and password.");
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

  console.log({ userResult });

  if (userResult.githubId) {
    return error(
      400,
      "Account connected with GitHub. Please login with GitHub",
    );
  }

  if (userResult === undefined || userResult === null) {
    return error(400, "Account does not exist");
  }

  const validPassword = await verifyPasswordHash(
    userResult.passwordHash || "",
    password,
  );
  if (!validPassword) {
    return error(400, "Invalid password");
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

export const register = form(registerSchema, async (newUser) => {
  const event = getRequestEvent();
  const { email, name, password, confirmPassword } = newUser;

  if (password !== confirmPassword) {
    return error(400, "Passwords do not match");
  }
  const {
    value: [userEmailCheck],
  } = (await getUserBy({
    query: {
      email,
    },
    options: {
      with_session: false,
    },
  })) as HelperResult<NewUser[]>;

  if (userEmailCheck !== undefined && userEmailCheck !== null) {
    return error(400, "Email is already used");
  }
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);
  const {
    valid,
    value: [userResult],
  } = await addUser([
    {
      email,
      name,
      passwordHash,
      recoveryCode: encryptedRecoveryCode,
    },
  ]);

  if (!valid) {
    return error(400, "Failed to create user");
  }

  // TODO: send email verification
  // const emailVerificationRequest = createEmailVerificationRequest(
  //   userResult.id,
  //   userResult.email,
  // );
  // sendVerificationEmail(
  //   emailVerificationRequest.email,
  //   emailVerificationRequest.code,
  // );
  // setEmailVerificationRequestCookie(event, emailVerificationRequest);

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
  throw redirect(302, "/");
});
