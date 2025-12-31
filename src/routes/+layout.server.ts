import { requireAuth } from "$/server/auth";

export function load() {
  return {
    user: null,
    session: null,
  };
  return requireAuth();
}
