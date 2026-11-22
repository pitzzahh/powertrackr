import type { BillingInfo } from "#lib/types/billing-info.js";
import type { Infer } from "#lib/validators/shared.js";
import type { IMPORT_BILL_FORM_SCHEMA } from "#lib/validators/import.js";

export type ImportBillingItem = Infer<typeof IMPORT_BILL_FORM_SCHEMA>;

export type ImportBillingResult = {
  created: BillingInfo[];
  /** Sub-meter labels that matched no tenant and were skipped. */
  skipped: { label: string }[];
};

/** Row counts of a generated backup. */
export type ExportPreview = { billingInfos: number; subMeters: number; payments: number };
