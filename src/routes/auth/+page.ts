import { redirect } from "@sveltejs/kit";

export function load({ url: { searchParams, pathname } }) {
  const actions = ["login", "register"] as const;
  const act = searchParams.get("act");
  if (
    pathname !== "/auth" &&
    (!act || !actions.includes(act as "login" | "register"))
  ) {
    redirect(307, `/auth?act=login`);
  }
  return {
    action: "login",
  };
}
