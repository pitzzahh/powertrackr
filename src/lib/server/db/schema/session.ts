import {
  pgTable,
  text,
  bigint,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const session = pgTable(
  "Session",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    idleExpires: bigint("idle_expires", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("Session_id_key").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
    ),
    index("Session_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
