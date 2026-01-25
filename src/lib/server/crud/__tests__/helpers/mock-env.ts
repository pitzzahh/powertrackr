import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Load .env.test if present, but do not override already-set env vars.
const envTestPath = resolve(process.cwd(), ".env");
if (existsSync(envTestPath)) {
  config({ path: envTestPath, override: false });
}

// Export the values expected by `$env/static/private`. Prefer actual process.env values.
export const DATABASE_URL: string | undefined = process.env.DATABASE_URL;

// Only throw error if DATABASE_URL is missing and we're not in CI (where tests are skipped)
if (!DATABASE_URL && !process.env.CI) {
  throw new Error(
    "DATABASE_URL is not defined. For tests set DATABASE_URL in the environment or create a .env.test file."
  );
}

export const DATABASE_AUTH_TOKEN: string | undefined = process.env.DATABASE_AUTH_TOKEN;

export const ENCRYPTION_KEY: string =
  process.env.ENCRYPTION_KEY ?? "00112233445566778899aabbccddeeff"; // fallback (not for production)

export const GITHUB_CLIENT_ID: string | undefined =
  process.env.GITHUB_CLIENT_ID ?? "github-client-id";
export const GITHUB_CLIENT_SECRET: string | undefined =
  process.env.GITHUB_CLIENT_SECRET ?? "github-client-secret";

/**
 * Plunk values are normally provided via dynamic/private in tests, but exporting
 * a value (or undefined) here avoids accidental module resolution failures.
 */
export const PLUNK_BASE_URL = "https://next-api.useplunk.com";
export const PLUNK_SECRET_KEY: string | undefined = undefined;
