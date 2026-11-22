import * as v from "valibot";
import type { ImportBillingItem } from "#lib/types/import.js";
import {
  DATE_STRING_FIELD,
  POSITIVE_NUMBER_FIELD,
  READING_FIELD,
  STATUS_WITH_DEFAULT_FIELD,
} from "./shared.js";

/**
 * A billing item in an import payload. Sub-meters are referenced by label
 * (the tenant's name), not by id — the server resolves them.
 */
export const IMPORT_SUB_METER_SCHEMA = v.object({
  label: v.pipe(
    v.string(),
    v.check((val) => !!val, "is required")
  ),
  status: STATUS_WITH_DEFAULT_FIELD,
  // Absent = pending sub-meter; the billing imports as pending.
  reading: v.optional(READING_FIELD),
});

export const IMPORT_BILL_FORM_SCHEMA = v.object({
  date: DATE_STRING_FIELD,
  balance: POSITIVE_NUMBER_FIELD,
  totalkWh: POSITIVE_NUMBER_FIELD,
  subMeters: v.fallback(v.array(IMPORT_SUB_METER_SCHEMA), []),
  status: STATUS_WITH_DEFAULT_FIELD,
});

export const IMPORT_BILLING_FILE_SCHEMA = v.object({ file: v.file() });

const IMPORT_BILL_ARRAY_SCHEMA = v.array(IMPORT_BILL_FORM_SCHEMA);

export function parseImportItems(items: unknown): ImportBillingItem[] {
  return v.parse(IMPORT_BILL_ARRAY_SCHEMA, items);
}
