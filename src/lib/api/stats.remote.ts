import { query } from "$app/server";
import { db } from "$lib/server/db";
import { getGlobalStats } from "$lib/server/stats";
import { originCheck } from "$lib/server/auth";
import type { Stats } from "$/types/stats";

/**
 * Site-wide stats snapshot. One-shot remote query (no SSE stream): fetched
 * when the component mounts, refreshed on page reload, and cached while the
 * query is in active use.
 */
export const getStats = query(async (): Promise<Stats> => {
  originCheck();
  return await getGlobalStats(db());
});
