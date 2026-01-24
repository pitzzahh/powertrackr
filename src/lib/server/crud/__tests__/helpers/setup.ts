import { db, pool } from "$/server/db";
import { afterEach, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

// Ensure local migrations are applied when not running in CI
if (!process.env.CI) {
  await promisify(exec)("npm run db:push");
}

/**
 * Helpers to expose the real DB and pool to tests.
 * Tests will run against a real Postgres instance pointed to via DATABASE_URL.
 */
export function getTestDb() {
  return db;
}

export function getTestPool() {
  return pool;
}

export async function cleanupTestDatabase() {
  if (process.env.CI === "true") return;

  const p = getTestPool();

  // Clean up all tables in reverse order of dependencies
  await p.query(
    'TRUNCATE password_reset_session, email_verification_request, session, sub_meter, billing_info, payment, "user" RESTART IDENTITY CASCADE;'
  );
}

afterEach(async () => {
  await cleanupTestDatabase();
});

afterAll(async () => {
  if (process.env.CI === "true") return;

  // Close the pool when the worker finishes to avoid hanging test processes
  const p = getTestPool();
  await p.end();
});
