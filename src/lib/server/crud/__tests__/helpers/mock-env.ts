import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Load .env if present, but do not override already-set env vars.
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath, override: false });
}

// Export the values expected by `$env/static/private`.
export const TEST_DATABASE_URL: string | undefined = process.env.TEST_DATABASE_URL;

// Only throw error if TEST_DATABASE_URL is missing
if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is not defined. For tests set TEST_DATABASE_URL or add it to .env."
  );
}

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
