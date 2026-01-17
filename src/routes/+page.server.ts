import { requireAuth } from "$/server/auth";

export function load({ depends }) {
  depends("app:root");
  return requireAuth();
}
