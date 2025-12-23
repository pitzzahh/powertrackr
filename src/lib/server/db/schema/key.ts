import { pgTable, text, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from "./user";

export const key = pgTable("Key", {
	id: text().primaryKey().notNull(),
	hashedPassword: text("hashed_password"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("Key_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Key_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
