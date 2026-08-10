import { query } from "$app/server";
import { sleep } from "$lib";
import { db } from "$lib/server/db";
import { getGlobalStats, POLL_INTERVAL_MS } from "$lib/server/stats";
import { originCheck } from "$lib/server/auth";
import type { Stats } from "$/types/stats";

/**
 * Live site-wide stats. SvelteKit keeps the stream open while the query is
 * actively used on the client, shares one connection across consumers, and
 * stops server-side iteration when no component uses it anymore (including
 * reconnect with backoff if the connection drops).
 */
export const getStats = query.live(async function* (): AsyncGenerator<Stats> {
  originCheck();

  while (true) {
    try {
      yield await getGlobalStats(db());
    } catch (e) {
      console.warn("Failed to fetch global stats");
      console.warn(e);
    }
    await sleep(POLL_INTERVAL_MS);
  }
});
