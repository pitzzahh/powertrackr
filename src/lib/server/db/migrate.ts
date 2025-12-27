import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import Database from "better-sqlite3";
import { Client } from "pg";
import { user, payment, billingInfo, key, session } from "./schema";

const db = drizzle(new Database("powertrackr.db"));

async function migrate() {
  // Enable foreign keys
  db.run(sql`PRAGMA foreign_keys = ON`);

  // Create User table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "picture" TEXT
    )
  `);
  db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User" ("username")`,
  );

  // Create Payment table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "amount" REAL,
      "date" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "Payment_id_key" ON "Payment" ("id")`,
  );

  // Create BillingInfo table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "BillingInfo" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "user_id" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "totalKwh" INTEGER NOT NULL,
      "subKwh" INTEGER,
      "balance" REAL NOT NULL,
      "status" TEXT NOT NULL,
      "payPerKwh" REAL NOT NULL,
      "subReadingLatest" INTEGER,
      "subReadingOld" INTEGER,
      "paymentId" TEXT,
      "subPaymentId" TEXT,
      FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY ("subPaymentId") REFERENCES "Payment"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);
  db.run(
    sql`CREATE INDEX IF NOT EXISTS "BillingInfo_user_id_idx" ON "BillingInfo" ("user_id")`,
  );

  // Create Key table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "Key" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "hashed_password" TEXT,
      "user_id" TEXT NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);
  db.run(
    sql`CREATE INDEX IF NOT EXISTS "Key_user_id_idx" ON "Key" ("user_id")`,
  );

  // Create Session table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "user_id" TEXT NOT NULL,
      "active_expires" INTEGER NOT NULL,
      "idle_expires" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);
  db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "Session_id_key" ON "Session" ("id")`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS "Session_user_id_idx" ON "Session" ("user_id")`,
  );

  // Migrate data from PostgreSQL
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await pgClient.connect();

  try {
    console.log("Connected to PostgreSQL. Starting data migration...");

    // Migrate users
    console.log("Migrating users...");
    const existingUsers = await db.select().from(user).limit(1);
    if (existingUsers.length > 0) {
      console.log("Users table already has data. Skipping user migration.");
    } else {
      const usersResult = await pgClient.query('SELECT * FROM "User"');
      console.log(`Found ${usersResult.rows.length} users in PostgreSQL.`);
      if (usersResult.rows.length > 0) {
        await db.insert(user).values(usersResult.rows);
        console.log(
          `Successfully inserted ${usersResult.rows.length} users into SQLite.`,
        );
      } else {
        console.log("No users to migrate.");
      }
    }

    // Migrate payments
    console.log("Migrating payments...");
    const existingPayments = await db.select().from(payment).limit(1);
    if (existingPayments.length > 0) {
      console.log(
        "Payments table already has data. Skipping payment migration.",
      );
    } else {
      const paymentsResult = await pgClient.query('SELECT * FROM "Payment"');
      console.log(
        `Found ${paymentsResult.rows.length} payments in PostgreSQL.`,
      );
      if (paymentsResult.rows.length > 0) {
        const paymentsToInsert = paymentsResult.rows.map((row) => ({
          id: row.id,
          amount: row.amount,
          date: row.date.toISOString(),
        }));
        await db.insert(payment).values(paymentsToInsert);
        console.log(
          `Successfully inserted ${paymentsResult.rows.length} payments into SQLite.`,
        );
      } else {
        console.log("No payments to migrate.");
      }
    }

    // Migrate keys
    console.log("Migrating keys...");
    const existingKeys = await db.select().from(key).limit(1);
    if (existingKeys.length > 0) {
      console.log("Keys table already has data. Skipping key migration.");
    } else {
      const keysResult = await pgClient.query('SELECT * FROM "Key"');
      console.log(`Found ${keysResult.rows.length} keys in PostgreSQL.`);
      const validKeys = keysResult.rows.filter((row) => row.user_id);
      console.log(`Valid keys to insert: ${validKeys.length}`);
      if (validKeys.length > 0) {
        const keysToInsert = validKeys.map((row) => ({
          id: row.id,
          hashedPassword: row.hashed_password,
          userId: row.user_id,
        }));
        await db.insert(key).values(keysToInsert);
        console.log(
          `Successfully inserted ${validKeys.length} keys into SQLite.`,
        );
      } else {
        console.log("No valid keys to migrate.");
      }
    }

    // Migrate sessions
    console.log("Migrating sessions...");
    const existingSessions = await db.select().from(session).limit(1);
    if (existingSessions.length > 0) {
      console.log(
        "Sessions table already has data. Skipping session migration.",
      );
    } else {
      const sessionsResult = await pgClient.query('SELECT * FROM "Session"');
      console.log(
        `Found ${sessionsResult.rows.length} sessions in PostgreSQL.`,
      );
      if (sessionsResult.rows.length > 0) {
        const sessionsToInsert = sessionsResult.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          activeExpires: row.active_expires,
          idleExpires: row.idle_expires,
        }));
        await db.insert(session).values(sessionsToInsert);
        console.log(
          `Successfully inserted ${sessionsResult.rows.length} sessions into SQLite.`,
        );
      } else {
        console.log("No sessions to migrate.");
      }
    }

    // Migrate billing info
    console.log("Migrating billing info...");
    const existingBillingInfos = await db.select().from(billingInfo).limit(1);
    if (existingBillingInfos.length > 0) {
      console.log(
        "BillingInfo table already has data. Skipping billing info migration.",
      );
    } else {
      const billingInfosResult = await pgClient.query(
        'SELECT * FROM "BillingInfo"',
      );
      console.log(
        `Found ${billingInfosResult.rows.length} billing info records in PostgreSQL.`,
      );
      if (billingInfosResult.rows.length > 0) {
        const billingInfosToInsert = billingInfosResult.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          date: row.date.toISOString(),
          totalKwh: row.totalKwh,
          subKwh: row.subKwh,
          balance: row.balance,
          status: row.status,
          payPerKwh: row.payPerKwh,
          subReadingLatest: row.subReadingLatest,
          subReadingOld: row.subReadingOld,
          paymentId: row.paymentId,
          subPaymentId: row.subPaymentId,
        }));
        await db.insert(billingInfo).values(billingInfosToInsert);
        console.log(
          `Successfully inserted ${billingInfosResult.rows.length} billing info records into SQLite.`,
        );
      } else {
        console.log("No billing info to migrate.");
      }
    }

    console.log("Data migration completed successfully.");
  } catch (error) {
    console.error("Error during data migration:", error);
    throw error;
  } finally {
    await pgClient.end();
    console.log("Disconnected from PostgreSQL.");
  }

  console.log("Schema migration and data transfer completed successfully.");
}

migrate().catch(console.error);
