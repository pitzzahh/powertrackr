import { redirect } from "@sveltejs/kit";
import type { AuthFormProps } from "$routes/auth/(components)/auth-form.svelte";
import { createAndSendEmailVerification } from "$/server/email";
import { getEmailVerificationRequestBy } from "$/server/crud/email-verification-request-crud";

export async function load({ url: { searchParams, pathname }, parent }) {
  const data = await parent();
  if (
    data.session &&
    data.user &&
    (data.user.isOauthUser || data.user.emailVerified) &&
    (!data.user.registeredTwoFactor || data.session.twoFactorVerified)
  ) {
    redirect(302, "/");
  }
  const actions: AuthFormProps["action"][] = [
    "login",
    "register",
    "verify-email",
    "2fa-setup",
    "reset-password",
  ];
  const act = searchParams.get("act");
  if (
    (!act || !actions.includes(act as AuthFormProps["action"])) &&
    !(pathname === "/auth" && actions.includes(act as AuthFormProps["action"]))
  ) {
    redirect(307, `/auth?act=${act}`);
  }

  // Send email verification on first visit to verify-email page
  if (act === "verify-email" && data.user && !data.user.emailVerified) {
    const existing = await getEmailVerificationRequestBy({
      query: { userId: data.user.id },
      options: { limit: 1 },
    });
    if (!existing.valid || !existing.value || existing.value.length === 0) {
      try {
        await createAndSendEmailVerification(data.user.id, data.user.email);
      } catch (e) {
        console.warn("Failed to send email verification on page load", e);
      }
    }
  }

  return {
    action: act as AuthFormProps["action"],
  };
}
