import { relations } from "drizzle-orm/relations";
import { session } from "$/server/db/schema/session";
import { user } from "$/server/db/schema/user";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
