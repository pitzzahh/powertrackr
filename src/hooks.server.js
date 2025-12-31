import { svelteKitHandler } from "better-auth/svelte-kit";
import { building, dev } from "$app/environment";
import { auth } from "$/server/auth";

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  if (
    dev &&
    event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
  ) {
    return new Response(undefined, { status: 404 });
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
