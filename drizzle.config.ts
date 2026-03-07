import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.BUILD_DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "BUILD_DATABASE_URL, TEST_DATABASE_URL, or DATABASE_URL is not defined in environment variables"
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
