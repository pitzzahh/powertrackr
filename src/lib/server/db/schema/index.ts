import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(current_timestamp)`)
    .$onUpdate(() => new Date())
    .notNull(),
};

// Export all tables
export { user } from "./user";
export { payment } from "./payment";
export { billingInfo } from "./billing-info";
export { session } from "./session";
