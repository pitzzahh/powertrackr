import { drizzle } from "drizzle-orm/d1";
import { getRequestEvent } from "$app/server";
import type { D1Database } from "@cloudflare/workers-types";
import { relations } from "./relations";
import * as schema from "./schema";

// Use a factory that constructs the database so TypeScript can infer the full,
// correct return type from the concrete `schema` and `relations` we provide.
function createDb(d1: D1Database) {
  return drizzle(d1, { schema, relations });
}

// Export a Database type consumers can reference if needed.
export type Database = ReturnType<typeof createDb>;
// Transaction helper type representing the `tx` instance passed into a transaction callback.
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

let _testDb: Database | undefined;

export function setTestDb(testDb: Database | undefined) {
  _testDb = testDb;
}

export function db(): Database {
  if (_testDb) {
    return _testDb;
  }

  const d1 = getRequestEvent()?.platform?.env?.DB;

  if (!d1) {
    throw new Error("D1 database binding 'DB' is not available on the current platform.");
  }

  return createDb(d1);
}
