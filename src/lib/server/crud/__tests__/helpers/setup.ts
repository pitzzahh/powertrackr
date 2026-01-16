import { drizzle } from "drizzle-orm/libsql";
import { vi, beforeEach, afterEach } from "vitest";
import * as schema from "$/server/db/schema";
import { relations } from "$/server/db/relations";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
});

let testDb: ReturnType<typeof drizzle>;

export function getTestDb() {
  if (!testDb) {
    testDb = drizzle({
      connection: {
        url: ":memory:",
      },
      schema,
      relations,
    });
  }

  return testDb;
}

export async function setupTestDatabase() {
  const db = getTestDb();

  // Create all tables by running a simple migration-like setup
  await db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      github_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      email_verified INTEGER DEFAULT 0 NOT NULL,
      totp_key BLOB,
      recovery_code BLOB,
      registered_two_factor INTEGER DEFAULT 0 NOT NULL,
      image TEXT,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_email_key ON user(email)
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS payment (
      id TEXT PRIMARY KEY,
      amount REAL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS billing_info (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_kWh INTEGER NOT NULL,
      balance REAL NOT NULL,
      status TEXT NOT NULL,
      pay_per_kWh REAL NOT NULL,
      payment_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payment(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS billing_info_user_id_idx ON billing_info(user_id)
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS sub_meter (
      id TEXT PRIMARY KEY,
      billing_info_id TEXT NOT NULL,
      sub_kWh INTEGER,
      reading INTEGER NOT NULL,
      sub_reading_latest INTEGER,
      sub_reading_old INTEGER,
      payment_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (billing_info_id) REFERENCES billing_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payment(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS sub_meter_billing_info_id_idx ON sub_meter(billing_info_id)
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL,
      two_factor_verified INTEGER DEFAULT 0 NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS email_verification_request (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS email_verification_request_user_id_idx ON email_verification_request(user_id)
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      email_verified INTEGER DEFAULT 0 NOT NULL,
      two_factor_verified INTEGER DEFAULT 0 NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS password_reset_session_user_id_idx ON password_reset_session(user_id)
  `);

  return db;
}

export async function cleanupTestDatabase() {
  const db = getTestDb();

  // Clean up all tables in reverse order of dependencies
  await db.run("DELETE FROM password_reset_session");
  await db.run("DELETE FROM email_verification_request");
  await db.run("DELETE FROM session");
  await db.run("DELETE FROM sub_meter");
  await db.run("DELETE FROM billing_info");
  await db.run("DELETE FROM payment");
  await db.run("DELETE FROM user");
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
