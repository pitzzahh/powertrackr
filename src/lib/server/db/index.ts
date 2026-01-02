import { drizzle } from "drizzle-orm/sqlite-cloud";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";

const db = drizzle({ connection: DATABASE_URL, schema, relations });

export { db };
