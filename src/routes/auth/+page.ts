import { redirect } from "@sveltejs/kit";
import type { AuthFormProps } from "$routes/auth/(components)/auth-form.svelte";

// TODO: Validate if user is already authenticated and redirect accordingly
export function load({ url: { searchParams, pathname } }) {
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
