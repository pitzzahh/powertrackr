import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
  throw new Error("DATABASE_URL and DATABASE_AUTH_TOKEN is not defined in environment variables");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
