import * as v from "valibot";
import type { PlunkSendResult, PlunkTemplate } from "#lib/types/plunk.js";

// Shapes of the Plunk API responses we read. Loose objects: Plunk adds fields
// freely and we only depend on the ones listed.

const PLUNK_FIELD_ERROR_SCHEMA = v.looseObject({ field: v.string(), message: v.string() });

export const PLUNK_ERROR_SCHEMA = v.looseObject({
  code: v.string(),
  message: v.string(),
  errors: v.optional(v.array(PLUNK_FIELD_ERROR_SCHEMA)),
});

export const PLUNK_TEMPLATE_SCHEMA = v.looseObject({
  id: v.string(),
  name: v.string(),
  from: v.optional(v.string()),
});

// Plunk has returned the template list as { data: { items } }, { data: { data } },
// { data: [...] } and as a bare array; accept all of them and hand back the
// array. Entries are checked one by one so a malformed template is skipped
// instead of failing the whole list.
const TEMPLATES = v.pipe(
  v.array(v.unknown()),
  v.transform((list) => list.filter((t) => v.is(PLUNK_TEMPLATE_SCHEMA, t)))
);
export const PLUNK_TEMPLATE_LIST_SCHEMA = v.union([
  v.pipe(
    v.looseObject({ data: v.looseObject({ items: TEMPLATES }) }),
    v.transform((r) => r.data.items)
  ),
  v.pipe(
    v.looseObject({ data: v.looseObject({ data: TEMPLATES }) }),
    v.transform((r) => r.data.data)
  ),
  v.pipe(
    v.looseObject({ data: TEMPLATES }),
    v.transform((r) => r.data)
  ),
  TEMPLATES,
]);

export const PLUNK_SEND_RESULT_SCHEMA = v.variant("success", [
  v.looseObject({ success: v.literal(true) }),
  v.looseObject({ success: v.literal(false), error: v.optional(PLUNK_ERROR_SCHEMA) }),
]);

/** Templates from a list response; an unknown shape yields none. */
export function parsePlunkTemplates(json: unknown): PlunkTemplate[] {
  const result = v.safeParse(PLUNK_TEMPLATE_LIST_SCHEMA, json);
  return result.success ? result.output : [];
}

/** A send/contact response, or null when Plunk answered something unexpected. */
export function parsePlunkResult(json: unknown): PlunkSendResult | null {
  const result = v.safeParse(PLUNK_SEND_RESULT_SCHEMA, json);
  return result.success ? result.output : null;
}
