import { drizzle } from "drizzle-orm/sqlite-cloud";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import { Database } from "@sqlitecloud/drivers";
import * as schema from "./schema/index.js";

const db = drizzle({ client: new Database(DATABASE_URL), schema, relations });

export { db };
