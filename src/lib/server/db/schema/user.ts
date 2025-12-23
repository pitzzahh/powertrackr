import { pgTable, text, uniqueIndex, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	username: text().notNull(),
	picture: text(),
}, (table) => [
	uniqueIndex("User_username_key").using("btree", table.username.asc().nullsLast().op("text_ops")),
	pgPolicy("Enable all access for all users", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);
