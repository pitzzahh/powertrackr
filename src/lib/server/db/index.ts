import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "$env/dynamic/private";
import { relations } from "./relations";
import * as schema from "./schema";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Use a factory that constructs the database so TypeScript can infer the full,
// correct return type from the concrete `schema` and `relations` we provide.
function createDb() {
  // Use the object form which matches the node-postgres overload and allows
  // TypeScript to infer types from the provided `schema` & `relations`.
  return drizzle({ client: pool(), schema, relations });
}

// Export a Database type consumers can reference if needed.
export type Database = ReturnType<typeof createDb>;
// Transaction helper type representing the `tx` instance passed into a transaction callback.
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

let _db: Database | undefined;
let _pool: Pool | undefined;

export function db(): Database {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function pool() {
  if (!_pool) {
    _pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return _pool;
}
