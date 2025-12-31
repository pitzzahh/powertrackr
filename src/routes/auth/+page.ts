import { redirect } from "@sveltejs/kit";

export function load({ url: { searchParams } }) {
  const actions = ["login", "register"] as const;
  const act = searchParams.get("act") ?? "login";
  if (!actions.includes(act as "login" | "register")) {
    searchParams.set("act", "login");
    throw redirect(307, `/auth?${searchParams.toString()}`);
  }
  return {
    action: act as (typeof actions)[number],
  };
}
