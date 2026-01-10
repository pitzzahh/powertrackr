import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";
import { dev } from "$app/environment";

const client = createClient({
  url: dev ? "file:local.db" : process.env.REPLICA_PATH || "file:/data/replica.db",
  syncUrl: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
  syncInterval: process.env.SYNC_INTERVAL ? Number(process.env.SYNC_INTERVAL) : 60,
});

const db = drizzle({
  client,
  schema,
  relations,
});

export async function syncDatabase() {
  try {
    await client.sync();
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Failed to sync database:", error);
  }
}

if (dev) {
  console.debug("Development mode: using local.db for embedded replica");
}
syncDatabase().catch(console.error);

export { db, client };
