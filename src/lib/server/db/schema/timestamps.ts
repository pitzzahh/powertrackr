import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

/**
 * Use Postgres `timestamp` columns so timestamps are stored as native
 * timestamp values. Defaults use the database current time.
 */
export const timestamps = {
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
};
