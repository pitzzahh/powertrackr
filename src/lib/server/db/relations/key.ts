import { relations } from "drizzle-orm/relations";
import { key } from "../schema/key";
import { user } from "../schema/user";

export const keyRelations = relations(key, ({ one }) => ({
  user: one(user, {
    fields: [key.userId],
    references: [user.id],
  }),
}));
