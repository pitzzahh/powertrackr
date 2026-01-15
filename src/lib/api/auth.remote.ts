import { loginSchema, registerSchema, verifyEmailSchema, setup2FASchema } from "$/schemas/auth";
import {
  createSession,
  deleteSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
} from "$/server/auth";
import { addUser, getUserBy, updateUserBy } from "$/server/crud/user-crud";
import {
  getEmailVerificationRequestBy,
  updateEmailVerificationRequestBy,
} from "$/server/crud/email-verification-request-crud";
import { createAndSendEmailVerification } from "$/server/email";
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
  setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));

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

  // Attempt to create and send an email verification (best-effort)
  try {
    await createAndSendEmailVerification(userResult.id, userResult.email);
  } catch (e) {
    // Don't block registration for email failures; just log.
    console.warn("Failed to create or send email verification", e);
  }

  const sessionToken = generateSessionToken();

  const session = await createSession(sessionToken, userResult.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));

  if (!userResult.emailVerified) {
    if (!(await createAndSendEmailVerification(userResult.id, email))) {
      console.warn(
        "createAndSendEmailVerification did not create a verification for user",
        userResult.id
      );
    }
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

  // Validate code against DB
  const requestResult = await getEmailVerificationRequestBy({
    query: { userId: event.locals.session.userId, code },
    options: { limit: 1 },
  });

  if (!requestResult.valid || !requestResult.value || requestResult.value.length === 0) {
    error(400, "Invalid or expired verification code");
  }

  const [request] = requestResult.value;
  if (!request) {
    error(400, "Invalid or expired verification code");
  }
  // Accept multiple stored formats (ISO string, seconds, milliseconds, or Date).
  // Normalize to milliseconds for comparison with Date.now().
  // The DB may store expiration as an ISO string (TEXT) or as a numeric
  // timestamp (seconds or milliseconds). Normalize to milliseconds.
  const rawExpiresAt = request.expiresAt;
  let expiresAtMs = 0;
  if (typeof rawExpiresAt === "string") {
    expiresAtMs = Date.parse(rawExpiresAt);
  } else if (typeof rawExpiresAt === "number") {
    expiresAtMs = rawExpiresAt < 1_000_000_000_000 ? rawExpiresAt * 1000 : rawExpiresAt;
  } else {
    // Don't rely on `instanceof Date` (TS may not allow it here). If callers
    // passed a Date-like value or another representation, try to coerce it
    // gracefully to a numeric timestamp or parse a stringified form.
    const asNumber = Number((rawExpiresAt as any) ?? NaN);
    if (!Number.isNaN(asNumber)) {
      expiresAtMs = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    } else {
      const asString = rawExpiresAt ? String(rawExpiresAt as any) : "";
      expiresAtMs = asString ? Date.parse(asString) : 0;
    }
  }

  if (!expiresAtMs || expiresAtMs < Date.now()) {
    console.warn("Email verification code expired or invalid", {
      expiresAtRaw: request.expiresAt,
      expiresAtMs,
      now: Date.now(),
    });
    error(400, "Invalid or expired verification code");
  }

  // Mark the user's email as verified
  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    { emailVerified: true }
  );
  if (!updateResult.valid) {
    error(400, "Failed to verify email");
  }

  // Expire the verification request to prevent reuse (best-effort)
  if (request.id) {
    updateEmailVerificationRequestBy(
      { query: { id: request.id }, options: {} },
      { expiresAt: new Date(Date.now() - 1).toISOString() }
    ).catch(() => null);
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
