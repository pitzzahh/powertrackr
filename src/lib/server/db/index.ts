import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { DATABASE_URL } from "$env/static/private";

const db = drizzle(new Database(DATABASE_URL));

export { db };
