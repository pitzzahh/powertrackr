import { requireAuth } from "$/server/auth";

export const prerender = true;

export function load() {
  return requireAuth();
}
