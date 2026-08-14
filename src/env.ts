import { defineEnvVars } from "@sveltejs/kit/env";
import * as v from "valibot";

export const variables = defineEnvVars({
  // Optional (fall back to `undefined` when unset, matching the old
  // `$env/dynamic/*` semantics that call sites rely on with `??` fallbacks).
  EMAIL_VERIFICATION_TIMEOUT_MINUTES: { public: true, schema: v.optional(v.string()) },
  RESEND_COOLDOWN_SECONDS: { public: true, schema: v.optional(v.string()) },
  PLUNK_BASE_URL: { schema: v.optional(v.string()) },
  PLUNK_SECRET_KEY: { schema: v.optional(v.string()) },
  BASE_URL: { schema: v.optional(v.string()) },
  PASSWORD_RESET_TIMEOUT_MINUTES: { schema: v.optional(v.string()) },
  TURNSTILE_SECRET: { schema: v.optional(v.string()) },
  // Inlined at build time (were `$env/static/private`); required in practice.
  ENCRYPTION_KEY: { static: true },
  GITHUB_CLIENT_ID: { static: true },
  GITHUB_CLIENT_SECRET: { static: true },
  TEST_DATABASE_URL: { static: true },
});
