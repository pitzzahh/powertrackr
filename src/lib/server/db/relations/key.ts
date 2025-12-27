import { relations } from "drizzle-orm/relations";
import { key } from "$/server/db/schema/key";
import { user } from "$/server/db/schema/user";

export const keyRelations = relations(key, ({ one }) => ({
  user: one(user, {
    fields: [key.userId],
    references: [user.id],
  }),
}));
