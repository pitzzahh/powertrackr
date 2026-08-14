import { form } from "$app/server";
import * as v from "valibot";
import { importBillFormSchema } from "#lib/validators/import.js";
import { requireAuth } from "#lib/server/auth.js";
import { error, invalid } from "@sveltejs/kit";
import { importBillingHandler, type ImportBillingItem } from "#lib/server/data-import.js";
import { refreshBillingData } from "./billing-refresh";

/**
 * Remote form that performs the billing import.
 * Accepts an array where each entry is a billing item with label-based sub-meters.
 */
const importBillingSchema = v.object({ items: v.array(importBillFormSchema) });

export const importBilling = form(importBillingSchema, async (payload) => {
  const {
    session: { userId },
  } = requireAuth();

  try {
    const result = await importBillingHandler(payload.items as ImportBillingItem[], userId);
    refreshBillingData();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw error(400, msg || "Failed to import billing data");
  }
});

/**
 * Remote form that accepts a single file upload (multipart/form-data).
 * The uploaded file must be JSON containing an array of billing items (or an
 * object with an `items` array). The file is parsed and validated strictly
 * before being imported atomically via `importBillingHandler`.
 */
const importBillingFileSchema = v.object({ file: v.file() });

export const importBillingFile = form(importBillingFileSchema, async (payload, issues) => {
  const {
    session: { userId },
  } = requireAuth();

  const file = payload.file as File | undefined;

  if (!file) {
    // Attach an issue to the `file` field so the client can display it
    return invalid(issues.file("No file uploaded"));
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return invalid(issues.file("Failed to read uploaded file"));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return invalid(issues.file("Uploaded file is not valid JSON"));
  }

  // Accept either an array or an object with an `items` array
  let items: unknown[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { items?: unknown[] }).items)
  ) {
    items = (parsed as { items: unknown[] }).items;
  } else {
    return invalid(
      issues.file("JSON must be an array of billing items or an object with an `items` array")
    );
  }

  try {
    const validated = v.parse(v.array(importBillFormSchema), items);
    const result = await importBillingHandler(validated as ImportBillingItem[], userId);
    refreshBillingData();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Surface validation/domain errors as a file-level issue where possible
    return invalid(issues.file(msg || "Failed to import billing data"));
  }
});
