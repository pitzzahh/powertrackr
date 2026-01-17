import { pgTable, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from "./user";

export const emailVerificationRequest = pgTable(
  "email_verification_request",
  (t) => ({
    id: t.text().primaryKey(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: t.text().notNull(),
    code: t.text().notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
  }),
  (table) => [
    index("email_verification_request_user_id_idx").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "email_verification_request_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
