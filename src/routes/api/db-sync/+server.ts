import { syncDatabase } from "$lib/server/db";
import { json, type RequestEvent } from "@sveltejs/kit";

/**
 * Manual database sync endpoint
 * Triggers an immediate sync between local replica and remote Turso database
 *
 * Usage: POST /api/db-sync
 */
export async function POST(event: RequestEvent): Promise<Response> {
  if (event.locals.user === null || event.locals.session === null) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncDatabase();

    return json({
      success: true,
      message: "Database synced successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database sync failed:", error);

    return json(
      {
        success: false,
        error: "Failed to sync database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get sync status endpoint
 * Returns information about the embedded replica
 *
 * Usage: GET /api/db-sync
 */
export async function GET(event: RequestEvent): Promise<Response> {
  // Optional: Require authentication
  if (!event.locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return json({
    enabled: true,
    syncInterval: 60,
    mode: "embedded-replica",
    timestamp: new Date().toISOString(),
  });
}
