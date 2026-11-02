// Vitest stand-in for `cloudflare:workers` (see the alias in vitest.config.ts).
// Bindings don't exist in unit tests; DB-backed tests use setTestDb() instead.
// Tests needing specific bindings should vi.mock("cloudflare:workers") directly.
export const env: Record<string, never> = {};
