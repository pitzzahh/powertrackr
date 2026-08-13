import { building } from "$app/environment";
import { isPublicPathname } from "$lib/utils/constant";

export function load({ setHeaders, url, locals, cookies }) {
  const sidebarCollapsed = cookies.get("sidebar-collapsed") === "true";

  if (!building && isPublicPathname(url.pathname)) {
    setHeaders({
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Cookie",
    });
  }

  return {
    user: locals.user,
    session: locals.session,
    sidebarCollapsed,
  };
}
