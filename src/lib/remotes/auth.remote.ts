import { deleteSessionTokenCookie, invalidateSession } from "$/server/auth";
import { form, getRequestEvent } from "$app/server";
import { fail, redirect } from "@sveltejs/kit";

export const signout = form(async () => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    return fail(401);
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  throw redirect(303, "/auth");
});
