import { loginSchema, registerSchema, verifyEmailSchema, setup2FASchema } from "$/schemas/auth";
import {
  createSession,
  deleteSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
} from "$/server/auth";
import { addUser, getUserBy, updateUserBy } from "$/server/crud/user-crud";
import {
  encryptString,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "$/server/encryption";
import type { HelperResult } from "$/types/helper";
import type { NewUser } from "$/types/user";
import { form, getRequestEvent } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return redirect(303, "/auth?act=login");
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  redirect(303, "/auth?act=login");
});

export const login = form(loginSchema, async (user) => {
  const event = getRequestEvent();
  const { email, password } = user;
  if (typeof email !== "string" || typeof password !== "string") {
    error(400, "Invalid or missing fields");
  }
  if (email === "" || password === "") {
    error(400, "Please enter your email and password.");
  }
  const {
    value: [userResult],
  } = (await getUserBy({
    query: {
      email,
    },
    options: {
      with_session: false,
      fields: ["id", "passwordHash", "githubId", "emailVerified", "registeredTwoFactor"],
    },
  })) as HelperResult<NewUser[]>;

  if (userResult?.githubId) {
    error(400, "Account connected with GitHub, please login with GitHub");
  }

  if (userResult === undefined || userResult === null) {
    error(400, "Account does not exist");
  }

  const validPassword = await verifyPasswordHash(userResult.passwordHash!, password);
  if (!validPassword) {
    error(400, "Invalid password");
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userResult.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, session.expiresAt);

  if (!userResult.githubId && !userResult.emailVerified) {
    return redirect(302, "/auth?act=verify-email");
  }
  if (userResult.registeredTwoFactor) {
    return redirect(302, "/auth?act=2fa-setup");
  }
  return redirect(302, "/");
});

export const register = form(registerSchema, async (newUser, issues) => {
  const event = getRequestEvent();
  const { email, name, password, confirmPassword } = newUser;

  console.log({ newUser });

  if (password !== confirmPassword) {
    return invalid(issues.confirmPassword("Passwords do not match"));
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
    error(400, "Email is already used");
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
    error(400, "Failed to create user");
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

  const sessionToken = generateSessionToken();

  const session = await createSession(sessionToken, userResult.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, session.expiresAt);

  if (!userResult.emailVerified) {
    return redirect(302, "/auth?act=verify-email");
  }
  if (userResult.registeredTwoFactor) {
    return redirect(302, "/auth?act=2fa-setup");
  }
  return redirect(302, "/");
});

export const verifyEmail = form(verifyEmailSchema, async (data) => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    error(401, "Not authenticated");
  }
  const { code } = data;

  if (code != "012345") {
    error(400, "Invalid verification code");
  }
  // TODO: Implement proper verification
  // For now, assume code is correct and set emailVerified
  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    { emailVerified: true }
  );
  if (!updateResult.valid) {
    error(400, "Failed to verify email");
  }
  // Check if 2FA is registered
  const {
    value: [updatedUser],
  } = (await getUserBy({
    query: { id: event.locals.session.userId },
    options: { with_session: false, fields: ["registeredTwoFactor"] },
  })) as HelperResult<NewUser[]>;
  if (updatedUser.registeredTwoFactor) {
    return redirect(302, "/auth?act=2fa-setup");
  }
  return redirect(302, "/");
});

export const setup2FA = form(setup2FASchema, async (data) => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    error(401, "Not authenticated");
  }
  const { code: _code } = data;
  // TODO: Implement TOTP verification
  // For now, assume code is correct and set registeredTwoFactor
  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    { registeredTwoFactor: true }
  );
  if (!updateResult.valid) {
    error(400, "Failed to set up 2FA");
  }
  return redirect(302, "/");
});
