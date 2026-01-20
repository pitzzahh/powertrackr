import { requireAuth } from "$/server/auth";

export function load() {
  return requireAuth();
}
