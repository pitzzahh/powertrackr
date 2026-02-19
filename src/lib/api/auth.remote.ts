import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  twoFactorSchema as twoFactorCodeSchema,
  generate2FASecretSchema,
  verify2FASchema,
  disable2FASchema,
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
import { updateSessionBy } from "$/server/crud/session-crud";
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
  encrypt,
  decrypt,
  encryptString,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "$/server/encryption";
import { verifyTOTP } from "@oslojs/otp";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import crypto from "node:crypto";
import type { HelperResult } from "$/server/types/helper";
import type { NewUser } from "$/types/user";
import { form, getRequestEvent, query } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";
import { requireAuth as requireAuthServer } from "$/server/auth";

export const getAuthUser = query(async () => {
  try {
    const event = getRequestEvent();
    return event.locals;
  } catch {
    return {
      user: null,
      session: null,
    };
  }
});

export const requireAuth = query(() => requireAuthServer());

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return redirect(303, "/");
  }
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  redirect(303, "/");
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
    return redirect(303, "/auth?act=verify-email");
  }
  if (userResult.registeredTwoFactor) {
    return redirect(303, "/auth?act=2fa-checkpoint");
  }
  return redirect(301, "/dashboard");
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
    return redirect(302, "/auth?act=2fa-checkpoint");
  }
  return redirect(302, "/dashboard");
});

export const setup2FA = form(disable2FASchema, async (data, _issues) => {
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
  return redirect(302, "/dashboard");
});

export const checkpoint2FA = form(twoFactorCodeSchema, async (data, issues) => {
  // This endpoint verifies a TOTP code and marks the current session as twoFactorVerified.
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  // If the session is already flagged as twoFactorVerified, no need to re-run checkpoint.
  if (event.locals.session.twoFactorVerified) {
    // Already verified on this session — send to dashboard.
    return redirect(302, "/dashboard");
  }

  const { code } = data;

  // Validate input here and return friendly issue messages
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    // Provide a clear, user-friendly issue for an empty value
    return invalid(issues.code("Please enter the 6-digit authentication code."));
  }
  if (code.length !== 6) {
    return invalid(issues.code("The code must be 6 digits long."));
  }

  // Load the user's encrypted TOTP key
  const {
    valid,
    value: [userResult],
  } = (await getUserBy({
    query: { id: event.locals.session.userId },
    options: { limit: 1, fields: ["totpKey"] },
  })) as HelperResult<NewUser[]>;

  if (!valid || !userResult || !userResult.totpKey) {
    return invalid(issues.code("Two-factor authentication is not configured for this account"));
  }

  // Decrypt the TOTP key and verify the code
  let secretBytes: Uint8Array;
  try {
    secretBytes = decrypt(userResult.totpKey);
  } catch (e) {
    console.error("Failed to decrypt TOTP key for user", event.locals.session.userId, e);
    return invalid(issues.code("Unable to verify code at this time. Please try again later."));
  }

  const isValid = verifyTOTP(secretBytes, 30, 6, code);

  if (!isValid) {
    return invalid(issues.code("Invalid verification code"));
  }

  // Mark the current session as twoFactorVerified
  const sessionUpdate = await updateSessionBy(
    { query: { id: event.locals.session.id }, options: { with_session: false } },
    { twoFactorVerified: true }
  );

  if (!sessionUpdate.valid) {
    error(400, "Failed to verify session for two-factor authentication");
  }

  // After successful checkpoint, send the user to dashboard
  return redirect(302, "/dashboard");
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

export const generate2FASecret = form(generate2FASecretSchema, async () => {
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  // Generate a random 20-byte secret for TOTP
  const secretBytes = crypto.randomBytes(20);
  const secret = encodeBase32UpperCaseNoPadding(secretBytes);

  // Create the otpauth URL for QR code
  const issuer = "PowerTrackr";
  const accountName = encodeURIComponent(event.locals.user.email);
  const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  return { secret, otpauthUrl };
});

export const verify2FA = form(verify2FASchema, async (data, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  const { code, secret } = data;

  // Decode the secret from base32
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secretBytes = new Uint8Array(
    secret
      .split("")
      .map((c) => alphabet.indexOf(c))
      .reduce((acc: number[], val, i, arr) => {
        if (i % 8 === 0) {
          const chunk = arr.slice(i, i + 8);
          const bits = chunk.map((v) => v.toString(2).padStart(5, "0")).join("");
          for (let j = 0; j < bits.length; j += 8) {
            if (j + 8 <= bits.length) {
              acc.push(parseInt(bits.slice(j, j + 8), 2));
            }
          }
        }
        return acc;
      }, [])
  );

  // Verify the TOTP code (30 second window, 6 digits)
  const isValid = verifyTOTP(secretBytes, 30, 6, code);

  if (!isValid) {
    invalid(issues.code("Invalid verification code"));
  }

  // Encrypt and store the secret
  const encryptedSecret = Buffer.from(encrypt(secretBytes));
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = Buffer.from(encryptString(recoveryCode));

  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    {
      totpKey: encryptedSecret,
      recoveryCode: encryptedRecoveryCode,
      registeredTwoFactor: true,
    }
  );

  if (!updateResult.valid) {
    error(400, "Failed to enable 2FA");
  }

  // Also mark the current session as twoFactorVerified so the user is not
  // immediately prompted to re-verify 2FA after just setting it up.
  try {
    if (event.locals.session) {
      const sessionUpdate = await updateSessionBy(
        { query: { id: event.locals.session.id }, options: { with_session: false } },
        { twoFactorVerified: true }
      );

      if (sessionUpdate.valid) {
        // Update in-memory session so subsequent logic in this request sees it.
        event.locals.session.twoFactorVerified = true;
      } else {
        // Best-effort: don't block enabling 2FA if session update fails, but log it.
        console.warn("Failed to mark session as two-factor verified after enabling 2FA", {
          userId: event.locals.session.userId,
          sessionId: event.locals.session.id,
        });
      }
    }
  } catch (e) {
    console.warn("Error updating session twoFactorVerified flag", e);
  }

  return { success: true, recoveryCode };
});

export const disable2FA = form(disable2FASchema, async (data, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  const { code } = data;

  // Get user's TOTP key
  const {
    valid,
    value: [userResult],
  } = await getUserBy({
    query: { id: event.locals.session.userId },
    options: { with_session: false, fields: ["totpKey"] },
  });

  if (!valid || !userResult || !userResult.totpKey) {
    error(400, "2FA is not enabled");
  }

  // Decrypt the TOTP key
  const secretBytes = decrypt(userResult.totpKey);

  // Verify the TOTP code
  const isValid = verifyTOTP(secretBytes, 30, 6, code);

  if (!isValid) {
    invalid(issues.code("Invalid verification code"));
  }

  // Disable 2FA
  const updateResult = await updateUserBy(
    { query: { id: event.locals.session.userId }, options: { with_session: false } },
    {
      totpKey: null,
      recoveryCode: null,
      registeredTwoFactor: false,
    }
  );

  if (!updateResult.valid) {
    error(400, "Failed to disable 2FA");
  }

  return { success: true };
});
