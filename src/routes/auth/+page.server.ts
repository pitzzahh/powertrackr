import { redirect } from "@sveltejs/kit";
import type { AuthFormProps } from "$routes/auth/(components)/auth-form.svelte";
import { createAndSendEmailVerification } from "$/server/email";
import { getEmailVerificationRequestBy } from "$/server/crud/email-verification-request-crud";

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

  const actions: AuthFormProps["action"][] = [
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
      options: { limit: 1 },
    });
    if (!valid || !value || value.length === 0) {
      try {
        await createAndSendEmailVerification(user.id, user.email);
      } catch (e) {
        console.warn("Failed to send email verification on page load", e);
      }
    }
  }
  if (
    (!act || !actions.includes(act as AuthFormProps["action"])) &&
    !(pathname === "/auth" && actions.includes(act as AuthFormProps["action"]))
  ) {
    redirect(307, `/auth?act=${act || "login"}`);
  }
  return {
    action: act as AuthFormProps["action"],
  };
}
