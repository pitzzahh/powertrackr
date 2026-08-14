import { setTestDb, type Database } from "#lib/server/db/index.js";
import { createTestDb, closeTestDb } from "#lib/server/db/test-db.js";
import {
  billingInfo,
  emailVerificationRequest,
  passwordResetSession,
  payment,
  session,
  tenantReading,
  readingSubmission,
  user,
} from "#lib/server/db/schema/index.js";
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

/**
 * Helpers to expose the real DB to tests.
 * Tests will run against a fast libsql instance pointed to via TEST_DATABASE_URL.
 */
export function getTestDb() {
  return testDb;
}

export async function cleanupTestDatabase() {
  const db = getTestDb();

  // Clean up all tables in reverse order of dependencies
  await db.delete(readingSubmission);
  await db.delete(passwordResetSession);
  await db.delete(emailVerificationRequest);
  await db.delete(session);
  await db.delete(tenantReading);
  await db.delete(billingInfo);
  await db.delete(payment);
  await db.delete(user);
}

afterEach(async () => {
  await cleanupTestDatabase();
});

afterAll(async () => {
  await closeTestDb();
});
