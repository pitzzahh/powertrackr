import type { Infer } from "#lib/validators/shared.js";
import type { PAYMENT_INSERT_SCHEMA, PAYMENT_SELECT_SCHEMA } from "#lib/validators/entities.js";

export type Payment = Infer<typeof PAYMENT_SELECT_SCHEMA>;

export type NewPayment = Infer<typeof PAYMENT_INSERT_SCHEMA>;
