import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "sqlite",
  driver: "sqlite-cloud",
  dbCredentials: { url: process.env.DATABASE_URL }
});
