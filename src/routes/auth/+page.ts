import type { AuthFormProps } from "$/components/auth-form.svelte";
import { redirect } from "@sveltejs/kit";

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
    action: act as (typeof actions)[number],
  };
}
