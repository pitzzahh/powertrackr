import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// SvelteKit's `$env/*` modules can't be imported here: this file runs directly
// under drizzle-kit, outside the SvelteKit/Vite pipeline. Node's built-in
// loader (Node 20.12+) replaces `dotenv/config` with the same semantics:
// loads `.env` from the current directory without overriding existing vars.
if (existsSync(".env")) {
  process.loadEnvFile();
}

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is not defined in environment variables");
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
