import "dotenv/config";
import { defineConfig } from "drizzle-kit";

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
