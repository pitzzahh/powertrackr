import { sql } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";

/**
 * Store timestamps as ISO 8601 strings (UTC) so they are easy to use directly
 * from application code. The default uses SQLite strftime to emit an ISO-like
 * string with fractional seconds and a trailing Z (UTC).
 */
export const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
};
