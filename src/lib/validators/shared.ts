import * as v from "valibot";

// Schema for remote queries/commands that take no arguments.
export const EMPTY_SCHEMA = v.object({});

// Optional short string (e.g. env vars with `??` fallbacks at call sites).
export const OPTIONAL_STRING = v.optional(v.string());
