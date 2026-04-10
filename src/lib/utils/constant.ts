export const PUBLIC_PATHS = new Set(["/", "/privacy", "/terms"]);

export const PUBLIC_PATH_PREFIXES = ["/auth", "/events"];

export const PUBLIC_ROUTE_IDS = new Set(["/", "/privacy", "/terms"]);

export const PUBLIC_ROUTE_PREFIXES = ["/auth", "/events"];

export function isPublicPathname(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isPublicRouteId(routeId: string | null | undefined): boolean {
  if (!routeId) return false;
  if (PUBLIC_ROUTE_IDS.has(routeId)) return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => routeId.startsWith(prefix));
}
