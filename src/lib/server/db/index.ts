import type { BatchQuery, Database, NonEmptyArray } from "#lib/types/db.js";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { relations } from "./relations";

// Use a factory that constructs the database so TypeScript can infer the full,
// correct return type from the concrete `schema` and `relations` we provide.
export function createDb(d1: App.Platform["env"]["DB"]) {
  return drizzle(d1, { relations });
}
export function asNonEmptyBatch<T extends BatchQuery>(queries: T[]): NonEmptyArray<T> | null {
  return queries.length > 0 ? (queries as NonEmptyArray<T>) : null;
}

let _testDb: Database | undefined;

// The D1 binding is stable per isolate, so the drizzle instance (including the
// relations graph) is built once and reused. Rebuilding it on every query was
// pure overhead on hot paths like the stats polling loop.
let _db: Database | undefined;

export function setTestDb(testDb: Database | undefined) {
  _testDb = testDb;
}

export function db(): Database {
  if (_testDb) {
    return _testDb;
  }

  if (_db) {
    return _db;
  }

  const d1 = env.DB;

  if (!d1) {
    throw new Error("D1 database binding 'DB' is not available on the current platform.");
  }

  _db = createDb(d1);
  return _db;
}
