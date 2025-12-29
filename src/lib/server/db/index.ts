import { drizzle } from "drizzle-orm/sqlite-cloud";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";

const db = drizzle({ connection: DATABASE_URL, relations });

export { db };
