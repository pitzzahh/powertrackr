import { redirect } from "@sveltejs/kit";

export function load({ locals }) {
  if (!locals.user?.ownerId) {
    redirect(307, "/dashboard");
  }
}
