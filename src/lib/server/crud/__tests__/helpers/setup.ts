import type { Database } from "#lib/server/db/index.js";
import { afterEach, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env if present, but do not override already-set env vars. Vitest setup
// files run outside the SvelteKit pipeline, so `$app/env/*` isn't available here;
// Node's built-in loader (Node 20.12+) replaces dotenv.
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// Server modules (`$app/server` and below) cannot load under browser-like
// conditions, so component tests running in jsdom skip the database
// bootstrap entirely; they never touch the DB.
const isBrowser = typeof window !== "undefined";

type DbContext = {
  testDb: Database;
  closeTestDb: () => unknown;
  cleanup: () => Promise<void>;
};

// Filled in below on Node; stays null in browser environments.
let ctx: DbContext | null = null;

if (!isBrowser) {
  const { setTestDb } = await import("#lib/server/db/index.js");
  const { createTestDb, closeTestDb } = await import("#lib/server/db/test-db.js");
  const schema = await import("#lib/server/db/schema/index.js");

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  const isLibsqlUrl = (url: string) => /^(libsql|https?|wss?|file):/i.test(url);

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for test migrations. Use a libsql URL.");
  }

  if (!isLibsqlUrl(testDatabaseUrl)) {
    throw new Error(
      "TEST_DATABASE_URL must use a libsql-compatible URL (libsql, https, http, ws, wss, file)."
    );
  }

  process.env.BUILD_DATABASE_URL = testDatabaseUrl;
  await promisify(exec)("pnpm db:push");

  const testDb = createTestDb();
  setTestDb(testDb as unknown as Database);

  ctx = {
    testDb: testDb as unknown as Database,
    closeTestDb,
    // Clean up all tables in reverse order of dependencies
    cleanup: async () => {
      await testDb.delete(schema.readingSubmission);
      await testDb.delete(schema.passwordResetSession);
      await testDb.delete(schema.emailVerificationRequest);
      await testDb.delete(schema.session);
      await testDb.delete(schema.tenantReading);
      await testDb.delete(schema.billingInfo);
      await testDb.delete(schema.payment);
      await testDb.delete(schema.user);
    },
  };

  afterEach(async () => {
    await ctx?.cleanup();
  });

  afterAll(async () => {
    await ctx?.closeTestDb();
  });
}

/**
 * Helpers to expose the real DB to tests.
 * Tests will run against a fast libsql instance pointed to via TEST_DATABASE_URL.
 */
export function getTestDb() {
  if (!ctx) throw new Error("getTestDb is only available in Node-based tests.");
  return ctx.testDb;
}

export async function cleanupTestDatabase() {
  await ctx?.cleanup();
}
