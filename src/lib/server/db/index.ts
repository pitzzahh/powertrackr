import { drizzle } from "drizzle-orm/sqlite-cloud";
import { DATABASE_URL } from "$env/static/private";
import { relations } from "./relations";
import { Database } from "@sqlitecloud/drivers";

const db = drizzle({ client: new Database(DATABASE_URL), relations });

export { db };
