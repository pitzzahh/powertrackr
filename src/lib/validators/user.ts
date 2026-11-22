import * as v from "valibot";
import { EMAIL_FIELD, ID_FIELD, NAME_FIELD } from "./shared.js";

// Self-service profile edit. Only fields a user may set on their own account:
// never githubId / passwordHash (those have dedicated, checked flows).
export const UPDATE_USER_SCHEMA = v.object({
  name: v.optional(NAME_FIELD),
  email: v.optional(EMAIL_FIELD),
  image: v.optional(v.string()),
});

export const DELETE_USER_SCHEMA = v.object({
  id: ID_FIELD,
  confirmEmail: EMAIL_FIELD,
});
