import { redirect } from "@sveltejs/kit";

export function load({ url: { searchParams, pathname } }) {
  const actions = ["login", "register"] as const;
  const act = searchParams.get("act");
  if (
    (!act || !actions.includes(act as "login" | "register")) &&
    !(pathname === "/auth" && act === "login")
  ) {
    redirect(307, `/auth?act=login`);
  }
  return {
    action: act as (typeof actions)[number],
  };
}
