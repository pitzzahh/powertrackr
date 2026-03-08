import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { relations } from "./relations";
import * as schema from "./schema";

let client: Client | undefined;
let testDb: TestDatabase | undefined;

export function createTestDb(): TestDatabase {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not defined for test database.");
  }

  if (!client) {
    client = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  if (!testDb) {
    testDb = drizzle({ client, schema, relations });
  }

  return testDb;
}

export type TestDatabase = LibSQLDatabase<typeof schema, typeof relations>;

export function getTestDb(): TestDatabase {
  if (!testDb) {
    testDb = createTestDb();
  }
  return testDb;
}

export async function closeTestDb() {
  if (client) {
    client.close();
    client = undefined;
    testDb = undefined;
  }
}
