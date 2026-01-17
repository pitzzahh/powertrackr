export function load({ locals, cookies }) {
  const sidebarCollapsed = cookies.get("sidebar-collapsed") === "true";

  return {
    user: locals.user,
    session: locals.session,
    sidebarCollapsed,
  };
}
