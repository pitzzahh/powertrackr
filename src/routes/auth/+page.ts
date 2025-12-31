import { redirect } from "@sveltejs/kit";

export function load({ url: { searchParams } }) {
  const actions = ["login", "register"] as const;
  const act = (searchParams.get("act") ?? "login") as (typeof actions)[number];
  if (!actions.includes(act)) {
    redirect(302, `/auth?act=login`);
  }
  return {
    action: act,
  };
}
