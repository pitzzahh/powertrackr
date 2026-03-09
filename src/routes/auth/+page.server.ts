import { redirect } from "@sveltejs/kit";
import { getEmailVerificationRequestBy } from "$/server/crud/email-verification-request-crud";
import { createEmailVerification } from "$lib/server/email";
import type { AuthAction } from "$routes/auth/(components)/index.js";
import type { EmailVerificationRequest } from "$/types/email-verification-request";
import { env } from "$env/dynamic/public";

export async function load({ url: { searchParams, pathname }, locals: { user, session } }) {
  const act = searchParams.get("act");

  // If trying to access 2FA setup or checkpoint, require authentication — otherwise send to login
  if ((act === "2fa-setup" || act === "2fa-checkpoint") && (session === null || user === null)) {
    // user not authenticated, redirect to login
    redirect(307, "/auth?act=login");
  }

  // Allow access to the 2FA setup/checkpoint pages for authenticated users who still need to set up or verify 2FA.
  // Previously the guard redirected authenticated users who hadn't registered 2FA
  // away from the /auth page entirely, preventing them from visiting /auth?act=2fa-setup.
  if (
    act !== "2fa-setup" &&
    act !== "2fa-checkpoint" &&
    session &&
    user &&
    (user.isOauthUser || user.emailVerified) &&
    (!user.registeredTwoFactor || session.twoFactorVerified)
  ) {
    redirect(302, "/dashboard");
  }

  const actions: AuthAction[] = [
    "login",
    "register",
    "verify-email",
    "2fa-setup",
    "2fa-checkpoint",
    "reset-password",
    "forgot-password",
  ];

  // Send email verification on first visit to verify-email page
  if (act === "verify-email" && user && !user.emailVerified) {
    const { valid, value } = await getEmailVerificationRequestBy({
      query: { userId: user.id },
      options: { limit: 1, order: "desc" },
    });
    try {
      const data = value as unknown as EmailVerificationRequest;
      const isExpired = value && data?.expiresAt?.getTime() < Date.now();
      if (valid && !isExpired)
        return {
          action: act as AuthAction,
        };
      console.log("Sending initial email verification");
      void createEmailVerification(
        user.id,
        user.email,
        Number(env.PUBLIC_EMAIL_VERIFICATION_TIMEOUT_MINUTES || 1)
      );
    } catch (e) {
      console.warn("Failed to send email verification on page load", e);
    }
  }
  if (
    (!act || !actions.includes(act as AuthAction)) &&
    !(pathname === "/auth" && actions.includes(act as AuthAction))
  ) {
    redirect(307, `/auth?act=${act || "login"}`);
  }
  return {
    action: act as AuthAction,
  };
}
