/**
 * Mock for `$env/static/private` used during tests.
 *
 * This file is aliased to `$env/static/private` in the test Vite config so that
 * modules importing static private env variables (like `ENCRYPTION_KEY`) resolve
 * correctly when running tests.
 *
 * NOTE: These values are only for tests and should never be used in production.
 */

export const ENCRYPTION_KEY = "00112233445566778899aabbccddeeff"; // 16 bytes (32 hex chars) for AES-128
export const DATABASE_URL = ":memory:";
export const DATABASE_AUTH_TOKEN: string | undefined = undefined;

export const GITHUB_CLIENT_ID = "github-client-id";
export const GITHUB_CLIENT_SECRET = "github-client-secret";

/**
 * Plunk values are normally provided via dynamic/private in tests, but exporting
 * a value (or undefined) here avoids accidental module resolution failures.
 */
export const PLUNK_BASE_URL = "https://next-api.useplunk.com";
export const PLUNK_SECRET_KEY: string | undefined = undefined;
