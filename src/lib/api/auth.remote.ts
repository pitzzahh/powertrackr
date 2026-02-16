import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  setup2FASchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "$/validators/auth";
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
import {
  getPasswordResetSessionBy,
  updatePasswordResetSessionBy,
} from "$/server/crud/password-reset-session-crud";
import { createAndSendPasswordReset } from "$/server/email";

import {
  encryptString,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "$/server/encryption";
import type { HelperResult } from "$/server/types/helper";
import type { NewUser } from "$/types/user";
import { form, getRequestEvent, query } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";
import { requireAuth as requireAuthServer } from "$/server/auth";

export const requireAuth = query(() => requireAuthServer());

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return redirect(303, "/auth?act=login");
  }
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  redirect(303, "/auth?act=login");
});

export const login = form(loginSchema, async (user, issues) => {
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
    invalid(issues.email("Account connected with GitHub, please login with GitHub"));
  }

  if (userResult === undefined || userResult === null) {
    invalid(issues.email("Account does not exist"));
  }

  const validPassword = await verifyPasswordHash(userResult.passwordHash!, password);
  if (!validPassword) {
    invalid(issues.password("Invalid password"));
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
    invalid(issues.confirmPassword("Passwords do not match"));
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
    invalid(issues.email("Email is already used"));
  }

  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = Buffer.from(encryptString(recoveryCode));
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

  const sessionToken = generateSessionToken();

  const session = await createSession(sessionToken, userResult.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));

  return redirect(302, "/auth?act=verify-email");
});

export const verifyEmail = form(verifyEmailSchema, async (data, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    error(401, "Not authenticated");
  }
  const { code } = data;

  // Validate code against DB
  const {
    valid,
    value: [request],
  } = await getEmailVerificationRequestBy({
    query: { userId: event.locals.session.userId, code },
    options: { limit: 1 },
  });

  if (!valid || !request) {
    invalid(issues.code("Invalid or expired verification code"));
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
    console.warn("Email verification code expired", {
      expiresAtRaw: request.expiresAt,
      expiresAtMs,
      now: Date.now(),
    });
    invalid(issues.code("Email verification code expired, please request a new code"));
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
      { expiresAt: new Date(Date.now() - 1) }
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

export const setup2FA = form(setup2FASchema, async (data, _issues) => {
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

export const forgotPassword = form(forgotPasswordSchema, async (user) => {
  const { email } = user;
  if (typeof email !== "string") {
    error(400, "Invalid email");
  }
  // Check if user exists
  const {
    value: [userResult],
  } = await getUserBy({
    query: {
      email,
    },
    options: {
      with_session: false,
      fields: ["id"],
    },
  });

  if (!userResult) {
    // For security, don't reveal if email exists or not
    return { success: true };
  }

  // Create password reset session and send email
  await createAndSendPasswordReset(userResult.id!, email);

  return { success: true };
});

export const resetPassword = form(resetPasswordSchema, async (data, issues) => {
  const { code, password, confirmPassword } = data;

  if (password !== confirmPassword) {
    invalid(issues.confirmPassword("Passwords do not match"));
  }

  // Validate code against DB
  const {
    valid,
    value: [{ id, userId, expiresAt }],
  } = await getPasswordResetSessionBy({
    query: { code },
    options: { limit: 1, fields: ["id", "userId", "expiresAt"] },
  });

  if (!valid || (!userId && !expiresAt)) {
    invalid(issues.code("Invalid or expired reset code"));
  }

  // Check expiration
  if (!expiresAt || expiresAt < new Date()) {
    invalid(issues.code("Reset code expired"));
  }

  // Update password
  const passwordHash = await hashPassword(password);
  const updateResult = await updateUserBy(
    { query: { id: userId }, options: { with_session: false } },
    { passwordHash }
  );
  if (!updateResult.valid) {
    error(400, "Failed to reset password");
  }

  // Expire the reset session to prevent reuse
  if (id) {
    updatePasswordResetSessionBy({ query: { id } }, { expiresAt: new Date(Date.now() - 1) });
  }

  return redirect(302, "/auth?act=login");
});

export const changePassword = form(changePasswordSchema, async (data, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    error(401, "Not authenticated");
  }

  const { currentPassword, newPassword, confirmPassword } = data;

  if (newPassword !== confirmPassword) {
    invalid(issues.confirmPassword("Passwords do not match"));
  }

  // Get current user
  const {
    valid,
    value: [userResult],
  } = await getUserBy({
    query: { id: event.locals.session.userId },
    options: { limit: 1 },
  });

  if (!valid || !userResult || !userResult.passwordHash) {
    error(400, "User not found or password not set");
  }

  // Verify current password
  const validPassword = await verifyPasswordHash(userResult.passwordHash, currentPassword);
  if (!validPassword) {
    invalid(issues.currentPassword("Current password is incorrect"));
  }

  // Hash new password and update
  const passwordHash = await hashPassword(newPassword);
  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    { passwordHash }
  );

  if (!updateResult.valid) {
    error(400, "Failed to update password");
  }

  return true;
});
