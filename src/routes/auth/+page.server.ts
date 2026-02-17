import { redirect } from "@sveltejs/kit";
import type { AuthFormProps } from "$routes/auth/(components)/auth-form.svelte";
import { createAndSendEmailVerification } from "$/server/email";
import { getEmailVerificationRequestBy } from "$/server/crud/email-verification-request-crud";

export async function load({ url: { searchParams, pathname }, locals: { user, session } }) {
  if (
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
    "reset-password",
    "forgot-password",
  ];
  const act = searchParams.get("act");

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
