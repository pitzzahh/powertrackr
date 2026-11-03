import { defineEnvVars } from "@sveltejs/kit/env";
import { OPTIONAL_STRING } from "#lib/validators/shared.js";

export const variables = defineEnvVars({
  // Optional (fall back to `undefined` when unset, matching the old
  // `$env/dynamic/*` semantics that call sites rely on with `??` fallbacks).
  EMAIL_VERIFICATION_TIMEOUT_MINUTES: { public: true, schema: OPTIONAL_STRING },
  RESEND_COOLDOWN_SECONDS: { public: true, schema: OPTIONAL_STRING },
  PLUNK_BASE_URL: { schema: OPTIONAL_STRING },
  PLUNK_SECRET_KEY: { schema: OPTIONAL_STRING },
  BASE_URL: { schema: OPTIONAL_STRING },
  PASSWORD_RESET_TIMEOUT_MINUTES: { schema: OPTIONAL_STRING },
  TURNSTILE_SECRET: { schema: OPTIONAL_STRING },
  // Inlined at build time (were `$env/static/private`); required in practice.
  ENCRYPTION_KEY: { static: true },
  GITHUB_CLIENT_ID: { static: true },
  GITHUB_CLIENT_SECRET: { static: true },
  TEST_DATABASE_URL: { static: true },
});
