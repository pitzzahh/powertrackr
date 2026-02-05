import { requireAuth } from "$/server/auth.js";

export async function load() {
  requireAuth();
}
