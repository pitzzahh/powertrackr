import {
  LOGIN_SCHEMA,
  REGISTER_SCHEMA,
  VERIFY_EMAIL_SCHEMA,
  TWO_FACTOR_SCHEMA as twoFactorCodeSchema,
  GENERATE_2FA_SECRET_SCHEMA,
  VERIFY_2FA_SCHEMA,
  DISABLE_2FA_SCHEMA,
  FORGOT_PASSWORD_SCHEMA,
  RECOVER_2FA_SCHEMA,
  RESET_PASSWORD_SCHEMA,
  CHANGE_PASSWORD_SCHEMA,
} from "#lib/validators/auth.js";
import {
  createSession,
  deleteSessionTokenCookie,
  invalidateSession,
  requireAuth,
  setSessionTokenCookie,
} from "#lib/server/auth.js";
import { addUser, getUserBy, updateUserBy } from "#lib/server/crud/user-crud.js";
import { deleteSessionBy, updateSessionBy } from "#lib/server/crud/session-crud.js";
import {
  getEmailVerificationRequestBy,
  updateEmailVerificationRequestBy,
} from "#lib/server/crud/email-verification-request-crud.js";
import {
  getPasswordResetSessionBy,
  updatePasswordResetSessionBy,
} from "#lib/server/crud/password-reset-session-crud.js";
import { createPasswordReset } from "#lib/server/email.js";

import {
  encrypt,
  decrypt,
  decryptToString,
  encryptString,
  isSameSecret,
  generateRandomRecoveryCode,
  generateSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "#lib/server/encryption.js";
import { Secret, TOTP } from "otpauth";
import {
  decodeBase32IgnorePadding,
  encodeBase32UpperCaseNoPadding,
  encodeBase64url,
  decodeBase64url,
} from "@oslojs/encoding";
import crypto from "node:crypto";
import type { HelperResult } from "#lib/types/helper.js";
import type { NewUser } from "#lib/types/user.js";
import { form, getRequestEvent } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";
import { verifyTurnstileToken } from "#lib/server/turnstile.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import { env } from "cloudflare:workers";
import { TURNSTILE_SECRET } from "$app/env/private";

function verifyTotpCode(secretBytes: Uint8Array, code: string): boolean {
  return (
    new TOTP({
      secret: new Secret({ buffer: Uint8Array.from(secretBytes).buffer }),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    }).validate({ token: code, window: 0 }) !== null
  );
}

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    throw redirect(303, "/auth?act=login");
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  throw redirect(303, "/auth?act=login");
});

export const login = form(LOGIN_SCHEMA, async (user, issues) => {
  const event = getRequestEvent();
  const { email, password } = user;
  if (typeof email !== "string" || typeof password !== "string") {
    error(400, "Invalid or missing fields");
  }
  if (email === "" || password === "") {
    error(400, "Please enter your email and password.");
  }

  const valid = await verifyTurnstileToken(
    user.turnstileToken,
    TURNSTILE_SECRET!,
    event.getClientAddress()
  );

  // Verify the Turnstile token before rate limiting / scrypt / D1 work.
  if (!valid) {
    invalid(issues.turnstileToken("Security check failed. Please try again."));
  }

  // Rate limit login attempts per email
  if (await isRateLimited(env.LOGIN_RATE_LIMITER, email)) {
    invalid(issues.email("Too many login attempts. Please try again later."));
  }

  const {
    value: [userResult],
  } = (await getUserBy({
    query: { email },
    options: {
      with_session: false,
      fields: ["id", "passwordHash", "githubId", "emailVerified", "registeredTwoFactor"],
    },
  })) as HelperResult<NewUser[]>;

  if (userResult?.githubId) {
    invalid(issues.email("Account connected with GitHub, please login with GitHub"));
  }

  // One message for unknown email and wrong password, so login does not reveal
  // which emails have accounts.
  if (!userResult?.passwordHash || !(await verifyPasswordHash(userResult.passwordHash, password))) {
    invalid(issues.password("Invalid email or password"));
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userResult.id, {
    twoFactorVerified: false,
    ipAddress: event.getClientAddress(),
    userAgent: event.request.headers.get("user-agent"),
  });
  setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));

  if (!userResult.emailVerified) {
    throw redirect(303, "/auth?act=verify-email");
  }
  if (userResult.registeredTwoFactor) {
    throw redirect(303, "/auth?act=2fa-checkpoint");
  }
  throw redirect(301, "/dashboard");
});
export const register = form(REGISTER_SCHEMA, async (newUser, issues) => {
  const event = getRequestEvent();
  const { email, name, password, confirmPassword } = newUser;

  // Verify the Turnstile token before rate limiting / D1 work.
  if (
    !(await verifyTurnstileToken(
      newUser.turnstileToken,
      TURNSTILE_SECRET!,
      event.getClientAddress()
    ))
  ) {
    invalid(issues.turnstileToken("Security check failed. Please try again."));
  }

  // Rate limit registration attempts per email
  if (await isRateLimited(env.REGISTRATION_RATE_LIMITER, email)) {
    invalid(issues.email("Too many registration attempts. Please try again later."));
  }

  if (password !== confirmPassword) {
    invalid(issues.confirmPassword("Passwords do not match"));
  }

  const {
    value: [userEmailCheck],
  } = (await getUserBy({ query: { email }, options: { with_session: false } })) as HelperResult<
    NewUser[]
  >;

  if (userEmailCheck !== undefined && userEmailCheck !== null) {
    invalid(issues.email("Email is already used"));
  }

  const passwordHash = await hashPassword(password);
  const {
    valid,
    value: [userResult],
  } = await addUser([
    {
      email,
      name,
      passwordHash,
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

  throw redirect(302, "/auth?act=verify-email");
});

export const verifyEmail = form(VERIFY_EMAIL_SCHEMA, async (data, issues) => {
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

  // A code sent to a previous address must not verify the current one.
  if (!valid || !request || request.email !== event.locals.user?.email) {
    invalid(issues.code("Invalid or expired verification code"));
  }

  // `expires_at` is a timestamp_ms column, so drizzle always returns a Date.
  if (!request.expiresAt || request.expiresAt.getTime() < Date.now()) {
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

  // Expire the verification request to prevent reuse. Awaited: Workers may
  // cancel un-awaited work once the response is sent.
  if (request.id) {
    await updateEmailVerificationRequestBy(
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
    throw redirect(302, "/auth?act=2fa-checkpoint");
  }
  throw redirect(302, "/dashboard");
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
    throw redirect(302, "/dashboard");
  }

  const { code } = data;

  // 1M possible codes: without a limit a script could brute-force the checkpoint.
  if (await isRateLimited(env.LOGIN_RATE_LIMITER, `2fa:${event.locals.session.userId}`)) {
    invalid(issues.code("Too many attempts. Please wait a minute and try again."));
  }

  // Validate input here and return friendly issue messages
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    // Provide a clear, user-friendly issue for an empty value
    invalid(issues.code("Please enter the 6-digit authentication code."));
  }
  if (code.length !== 6) {
    invalid(issues.code("The code must be 6 digits long."));
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
    invalid(issues.code("Two-factor authentication is not configured for this account"));
  }

  // Decrypt the TOTP key and verify the code
  let secretBytes: Uint8Array;
  try {
    secretBytes = decrypt(decodeBase64url(userResult.totpKey));
  } catch (e) {
    console.error("Failed to decrypt TOTP key for user", event.locals.session.userId, e);
    invalid(issues.code("Unable to verify code at this time. Please try again later."));
  }

  const isValid = verifyTotpCode(secretBytes, code);

  if (!isValid) {
    invalid(issues.code("Invalid verification code"));
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
  throw redirect(302, "/dashboard");
});

// Lost authenticator: the one-time recovery code shown at 2FA setup turns 2FA
// off and verifies this session, so the user can set it up again.
export const recover2FA = form(RECOVER_2FA_SCHEMA, async ({ recoveryCode }, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }
  const { userId } = event.locals.session;

  if (await isRateLimited(env.LOGIN_RATE_LIMITER, `2fa:${userId}`)) {
    invalid(issues.recoveryCode("Too many attempts. Please wait a minute and try again."));
  }

  const {
    value: [userResult],
  } = await getUserBy({
    query: { id: userId },
    options: { limit: 1, fields: ["recoveryCode"] },
  });

  if (
    !userResult?.recoveryCode ||
    !isSameSecret(
      decryptToString(decodeBase64url(userResult.recoveryCode)),
      recoveryCode.trim().toUpperCase()
    )
  ) {
    invalid(issues.recoveryCode("Invalid recovery code"));
  }

  await updateUserBy(
    { query: { id: userId }, options: { with_session: false } },
    { totpKey: null, recoveryCode: null, registeredTwoFactor: false }
  );
  await updateSessionBy(
    { query: { id: event.locals.session.id }, options: { with_session: false } },
    { twoFactorVerified: true }
  );

  throw redirect(303, "/auth?act=2fa-setup");
});

export const forgotPassword = form(FORGOT_PASSWORD_SCHEMA, async (user) => {
  const event = getRequestEvent();
  const { email } = user;
  if (typeof email !== "string") {
    error(400, "Invalid email");
  }

  // Rate limit password reset requests per email
  if (await isRateLimited(env.EMAIL_RATE_LIMITER, email)) {
    // For security, don't reveal rate limit info
    return { success: true };
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
  await createPasswordReset(userResult.id!, email, event.url.origin);

  redirect(303, "/auth?act=reset-password");
});

export const resetPassword = form(RESET_PASSWORD_SCHEMA, async (data, issues) => {
  const event = getRequestEvent();
  const { code, _password, _confirmPassword } = data;

  if (_password !== _confirmPassword) {
    invalid(issues._confirmPassword("Passwords do not match"));
  }

  // Codes are looked up by value alone, so cap guesses per client.
  if (await isRateLimited(env.EMAIL_RATE_LIMITER, `reset:${event.getClientAddress()}`)) {
    invalid(issues.code("Too many attempts. Please wait a minute and try again."));
  }

  const {
    value: [resetSession],
  } = await getPasswordResetSessionBy({
    query: { code },
    options: { limit: 1, fields: ["id", "userId", "expiresAt"] },
  });

  if (!resetSession?.id || !resetSession.userId) {
    invalid(issues.code("Invalid or expired reset code"));
  }
  const { id, userId, expiresAt } = resetSession;

  if (!expiresAt || expiresAt < new Date()) {
    invalid(issues.code("Reset code expired"));
  }

  const passwordHash = await hashPassword(_password);
  const updateResult = await updateUserBy(
    { query: { id: userId }, options: { with_session: false } },
    { passwordHash }
  );
  if (!updateResult.valid) {
    error(400, "Failed to reset password");
  }

  // Burn the code and sign out every device: whoever knew the old password
  // must not keep a session.
  await updatePasswordResetSessionBy({ query: { id } }, { expiresAt: new Date(Date.now() - 1) });
  await deleteSessionBy({ query: { userId } });

  throw redirect(302, "/auth?act=login");
});

export const changePassword = form(CHANGE_PASSWORD_SCHEMA, async (data, issues) => {
  // requireAuth, not a bare session check: a session that has not passed the
  // 2FA checkpoint must not change the password.
  const { session } = requireAuth();

  const { currentPassword, newPassword, confirmPassword } = data;

  if (newPassword !== confirmPassword) {
    invalid(issues.confirmPassword("Passwords do not match"));
  }

  // Get current user
  const {
    valid,
    value: [userResult],
  } = await getUserBy({
    query: { id: session.userId },
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
    { query: { id: session.userId }, options: { with_session: false } },
    { passwordHash }
  );

  if (!updateResult.valid) {
    error(400, "Failed to update password");
  }

  // Sign out every other device: a password change is the usual answer to a
  // suspected compromise.
  await deleteSessionBy({ query: { userId: session.userId }, options: { exclude_id: session.id } });

  return true;
});

export const generate2FASecret = form(GENERATE_2FA_SECRET_SCHEMA, async () => {
  const { user } = requireAuth();

  // Generate a random 20-byte secret for TOTP
  const secretBytes = crypto.randomBytes(20);
  const secret = encodeBase32UpperCaseNoPadding(secretBytes);

  // Create the otpauth URL for QR code
  const totp = new TOTP({
    issuer: "PowerTrackr",
    label: user.email,
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const otpauthUrl = totp.toString();

  return { secret, otpauthUrl };
});

export const verify2FA = form(VERIFY_2FA_SCHEMA, async (data, issues) => {
  // requireAuth enforces the 2FA checkpoint; without it a password-only
  // session could swap in its own TOTP secret and come out "2FA verified".
  const { user, session } = requireAuth();
  if (user.registeredTwoFactor) {
    error(400, "Two-factor authentication is already enabled. Disable it first.");
  }

  const { code, secret } = data;

  // Decode the secret from base32
  const secretBytes = decodeBase32IgnorePadding(secret);

  // Verify the TOTP code (30 second window, 6 digits)
  const isValid = verifyTotpCode(secretBytes, code);

  if (!isValid) {
    invalid(issues.code("Invalid verification code"));
  }

  // Encrypt and store the secret
  const encryptedSecret = encodeBase64url(encrypt(secretBytes));
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encodeBase64url(encryptString(recoveryCode));

  const updateResult = await updateUserBy(
    {
      query: { id: session.userId },
      options: { with_session: false },
    },
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
  const sessionUpdate = await updateSessionBy(
    { query: { id: session.id }, options: { with_session: false } },
    { twoFactorVerified: true }
  );
  if (!sessionUpdate.valid) {
    console.warn("Failed to mark session as two-factor verified after enabling 2FA", {
      userId: session.userId,
      sessionId: session.id,
    });
  }

  return { success: true, recoveryCode };
});

export const disable2FA = form(DISABLE_2FA_SCHEMA, async (data, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null || event.locals.user === null) {
    error(401, "Not authenticated");
  }

  const { code } = data;

  if (await isRateLimited(env.LOGIN_RATE_LIMITER, `2fa:${event.locals.session.userId}`)) {
    invalid(issues.code("Too many attempts. Please wait a minute and try again."));
  }

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
  const secretBytes = decrypt(decodeBase64url(userResult.totpKey));

  // Verify the TOTP code
  const isValid = verifyTotpCode(secretBytes, code);

  if (!isValid) {
    invalid(issues.code("Invalid verification code"));
  }

  // Disable 2FA
  const updateResult = await updateUserBy(
    {
      query: { id: event.locals.session.userId },
      options: { with_session: false },
    },
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
