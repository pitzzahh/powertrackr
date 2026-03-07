import { setTestDb, type Database } from "$/server/db";
import { createTestDb, closeTestDb } from "$/server/db/test-db";
import {
  billingInfo,
  emailVerificationRequest,
  passwordResetSession,
  payment,
  session,
  subMeter,
  user,
} from "$/server/db/schema";
import { afterEach, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath, override: false });
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
 * Tests will run against a fast libsql instance pointed to via DATABASE_URL.
 */
export function getTestDb() {
  return testDb;
}

export async function cleanupTestDatabase() {
  const db = getTestDb();

  // Clean up all tables in reverse order of dependencies
  await db.delete(passwordResetSession);
  await db.delete(emailVerificationRequest);
  await db.delete(session);
  await db.delete(subMeter);
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
