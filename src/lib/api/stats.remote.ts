import { query } from "$app/server";
import { db } from "#lib/server/db/index.js";
import { getGlobalStats } from "#lib/server/stats.js";
import { originCheck } from "#lib/server/auth.js";
import type { Stats } from "#lib/types/stats.js";

/**
 * Site-wide stats snapshot. One-shot remote query (no SSE stream): fetched
 * when the component mounts, refreshed on page reload, and cached while the
 * query is in active use.
 */
export const getStats = query(async (): Promise<Stats> => {
  originCheck();
  return await getGlobalStats(db());
});
