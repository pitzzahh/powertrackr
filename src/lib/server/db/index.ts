import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from "$env/static/private";
import { relations } from "./relations";
import * as schema from "./schema/index.js";
import { dev } from "$app/environment";

// Lazy-loaded client and database instances
let _client: ReturnType<typeof createClient> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _initialized = false;

function getClient() {
  if (!_client) {
    _client = createClient({
      url: dev ? "file:local.db" : "file:/data/replica.db",
      syncUrl: DATABASE_URL,
      authToken: DATABASE_AUTH_TOKEN,
      syncInterval: process.env.SYNC_INTERVAL ? Number(process.env.SYNC_INTERVAL) : 60,
    });
  }
  return _client;
}

function getDb() {
  if (!_db) {
    _db = drizzle({
      client: getClient(),
      schema,
      relations,
    });
  }
  return _db;
}

// Initialize on first access (not at import time)
async function initialize() {
  if (_initialized) return;

  try {
    if (dev) {
      console.log("Development mode: using local.db for embedded replica");
    }

    // Perform initial sync
    await syncDatabase();
    _initialized = true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    // Don't throw - allow app to continue, it will retry on next access
  }
}

export async function syncDatabase() {
  try {
    const client = getClient();
    await client.sync();
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Failed to sync database:", error);
    throw error;
  }
}

// Lazy-loaded database instance
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = getDb();

    // Initialize on first database access
    if (!_initialized) {
      initialize().catch(console.error);
    }

    return database[prop as keyof typeof database];
  },
});

// Lazy-loaded client instance
export const client = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getClient()[prop as keyof ReturnType<typeof createClient>];
  },
});
