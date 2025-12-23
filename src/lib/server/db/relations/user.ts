import { relations } from "drizzle-orm/relations";
import { user } from "../schema/user";
import { billingInfo } from "../schema/billing-info";
import { key } from "../schema/key";
import { session } from "../schema/session";

export const userRelations = relations(user, ({ many }) => ({
  billingInfos: many(billingInfo),
  keys: many(key),
  sessions: many(session),
}));
