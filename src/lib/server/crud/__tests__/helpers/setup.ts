import { newDb } from "pg-mem";
import { drizzle } from "drizzle-orm/node-postgres";
import { vi, beforeEach, afterEach } from "vitest";
import * as schema from "$/server/db/schema";
import { relations } from "$/server/db/relations";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
});

let pgMemInstance: ReturnType<typeof newDb> | undefined;
let pool: any;
let testDb: ReturnType<typeof drizzle> | undefined;

export function getTestDb() {
  if (!testDb) {
    pgMemInstance = newDb();
    const adapter = pgMemInstance.adapters.createPg();
    const PgPool = adapter.Pool;
    pool = new PgPool();
    testDb = drizzle(pool, { schema, relations });
  }

  return testDb;
}

export function getTestPool() {
  if (!pool) {
    getTestDb();
  }
  return pool;
}

export async function setupTestDatabase() {
  const pool = getTestPool();

  // Create all tables using Postgres types
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      github_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE NOT NULL,
      totp_key BYTEA,
      recovery_code BYTEA,
      registered_two_factor BOOLEAN DEFAULT FALSE NOT NULL,
      image TEXT,
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_email_key ON "user"(email)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment (
      id TEXT PRIMARY KEY,
      amount REAL,
      date TIMESTAMPTZ DEFAULT now() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing_info (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      total_kWh INTEGER NOT NULL,
      balance REAL NOT NULL,
      status TEXT NOT NULL,
      pay_per_kWh REAL NOT NULL,
      payment_id TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payment(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS billing_info_user_id_idx ON billing_info(user_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sub_meter (
      id TEXT PRIMARY KEY,
      billing_info_id TEXT NOT NULL,
      sub_kWh INTEGER,
      reading INTEGER NOT NULL,
      sub_reading_latest INTEGER,
      sub_reading_old INTEGER,
      payment_id TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      FOREIGN KEY (billing_info_id) REFERENCES billing_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payment(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS sub_meter_billing_info_id_idx ON sub_meter(billing_info_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL,
      two_factor_verified BOOLEAN DEFAULT FALSE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_request (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS email_verification_request_user_id_idx ON email_verification_request(user_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE NOT NULL,
      two_factor_verified BOOLEAN DEFAULT FALSE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS password_reset_session_user_id_idx ON password_reset_session(user_id)
  `);

  return testDb;
}

export async function cleanupTestDatabase() {
  const pool = getTestPool();

  // Clean up all tables in reverse order of dependencies
  await pool.query(
    'TRUNCATE password_reset_session, email_verification_request, session, sub_meter, billing_info, payment, "user" RESTART IDENTITY CASCADE;'
  );
}

// Mock the database module
vi.mock("$/server/db", () => ({
  db: getTestDb(),
}));

beforeEach(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupTestDatabase();
});
