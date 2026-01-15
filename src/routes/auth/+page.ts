import { redirect } from "@sveltejs/kit";
import type { AuthFormProps } from "$routes/auth/(components)/auth-form.svelte";

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
  return {
    action: act as AuthFormProps["action"],
  };
}
