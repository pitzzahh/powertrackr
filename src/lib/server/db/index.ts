import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

let _db: ReturnType<typeof drizzle> | undefined;
let _pool: Pool | undefined;

export function db() {
  if (!_db) {
    _pool = new Pool({ connectionString: DATABASE_URL });
    _db = drizzle({ client: _pool, schema, relations });
  }
  return _db;
}
