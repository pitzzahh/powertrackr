import type { Infer } from "#lib/validators/shared.js";
import type { PLUNK_SEND_RESULT_SCHEMA, PLUNK_TEMPLATE_SCHEMA } from "#lib/validators/plunk.js";

export type PlunkTemplate = Infer<typeof PLUNK_TEMPLATE_SCHEMA>;

export type PlunkSendResult = Infer<typeof PLUNK_SEND_RESULT_SCHEMA>;
