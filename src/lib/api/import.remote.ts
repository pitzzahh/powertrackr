import { query, form } from "$app/server";
import * as v from "valibot";
import { billFormSchema } from "$/validators/billing-info";
import { requireAuth } from "$/server/auth";
import { error, invalid } from "@sveltejs/kit";
import { createBillingInfoLogic } from "$/server/crud/billing-info-crud";
import { importBillingHandler } from "$/server/data-import";
import { getExtendedBillingInfos } from "./billing-info.remote";

/**
 * Remote form that performs the billing import.
 * Accepts an array where each entry follows the `billFormSchema`.
 */
const importBillingSchema = v.object({ items: v.array(billFormSchema) });

export const importBilling = form(importBillingSchema, async (payload) => {
  const {
    session: { userId },
  } = requireAuth();

  const items = payload.items as Parameters<typeof createBillingInfoLogic>[0][];

  try {
    const created = await importBillingHandler(items, userId);
    getExtendedBillingInfos({ userId }).refresh();
    return created;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw error(400, msg || "Failed to import billing data");
  }
});

/**
 * Remote form that accepts a single file upload (multipart/form-data).
 * The uploaded file must be JSON containing an array of billing items (or an
 * object with an `items` array). The file is parsed and validated strictly
 * against `billFormSchema` before being imported atomically via
 * `importBillingHandler`.
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
    text = await (file as File).text();
  } catch {
    return invalid(issues.file("Failed to read uploaded file"));
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return invalid(issues.file("Uploaded file is not valid JSON"));
  }

  // Accept either an array or an object with an `items` array
  let items: any[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && Array.isArray(parsed.items)) {
    items = parsed.items;
  } else {
    return invalid(
      issues.file("JSON must be an array of billing items or an object with an `items` array")
    );
  }

  try {
    // Strict validation against the billing item schema
    const validated = v.parse(v.array(billFormSchema), items);
    const created = await importBillingHandler(validated, userId);
    getExtendedBillingInfos({ userId }).refresh();
    return created;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Surface validation/domain errors as a file-level issue where possible
    return invalid(issues.file(msg || "Failed to import billing data"));
  }
});

/**
 * Lightweight preview endpoint that summarizes a batch import (just returns count).
 */
export const summarizeImport = query(importBillingSchema, async (payload) => {
  return { billingInfos: (payload.items ?? []).length };
});
