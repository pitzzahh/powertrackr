import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle({ client: pool, schema, relations });

export { db, pool };
