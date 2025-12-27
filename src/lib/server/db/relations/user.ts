import { relations } from "drizzle-orm/relations";
import { user } from "$/server/db/schema/user";
import { billingInfo } from "$/server/db/schema/billing-info";
import { key } from "$/server/db/schema/key";
import { session } from "$/server/db/schema/session";

export const userRelations = relations(user, ({ many }) => ({
  billingInfos: many(billingInfo),
  keys: many(key),
  sessions: many(session),
}));
