import { db, pool } from "$/server/db";
import { vi, afterEach, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11),
});

const execAsync = promisify(exec);
await execAsync("npm run db:push");

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
  // Close the pool when the worker finishes to avoid hanging test processes
  const p = getTestPool();
  await p.end();
});
