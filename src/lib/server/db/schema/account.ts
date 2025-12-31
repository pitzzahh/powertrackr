import { sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { timestamps } from "./timestamps";

export const account = sqliteTable("account", (t) => ({
  id: t.text().primaryKey(),
  accountId: t.text("account_id").notNull(),
  providerId: t.text("provider_id").notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: t.text("access_token"),
  refreshToken: t.text("refresh_token"),
  idToken: t.text("id_token"),
  accessTokenExpiresAt: t.integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: t.integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: t.text(),
  password: t.text(),
  ...timestamps,
}));

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
