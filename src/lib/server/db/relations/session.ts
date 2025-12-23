import { relations } from "drizzle-orm/relations";
import { session } from "../schema/session";
import { user } from "../schema/user";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
