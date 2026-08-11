import { sqliteTable, index, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { timestamps } from ".";

/**
 * A tenant-submitted meter reading. The tenant submits readings for their own
 * sub-meter, so the row is keyed by the tenant user id only.
 */
export const readingSubmission = sqliteTable(
  "reading_submission",
  {
    id: text("id").primaryKey().notNull(),
    tenantUserId: text("tenant_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reading: integer("reading").notNull(),
    ...timestamps,
  },
  (table) => [index("reading_submission_tenant_user_id_idx").on(table.tenantUserId)]
);
