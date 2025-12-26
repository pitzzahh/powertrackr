import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { DATABASE_URL } from "$env/static/private";

const db = drizzle({ client: new Database(DATABASE_URL) });

export { db };
