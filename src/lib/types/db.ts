import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { createDb } from "#lib/server/db/index.js";
import type { relations } from "#lib/server/db/relations.js";
// Export a Database type consumers can reference if needed.
export type Database = ReturnType<typeof createDb>;

// Batch helper types for D1 batch API.
export type BatchQuery = Parameters<Database["batch"]>[0][number];

export type BatchResult = Awaited<ReturnType<Database["batch"]>>[number];

export type NonEmptyArray<T> = [T, ...T[]];

export type TestDatabase = LibSQLDatabase<typeof relations>;
