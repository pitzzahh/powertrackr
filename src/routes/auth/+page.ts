import { redirect } from "@sveltejs/kit";

export function load({ url: { searchParams } }) {
  const actions = ["login", "register"] as const;
  const act = searchParams.get("act") ?? "login";
  if (!actions.includes(act as "login" | "register")) {
    redirect(307, "/auth?act=login");
  }
  return {
    action: act,
  };
}
