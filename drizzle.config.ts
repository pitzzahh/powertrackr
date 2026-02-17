import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  schemaFilter: ["public"],
  tablesFilter: [
    "user",
    "payment",
    "billing_info",
    "sub_meter",
    "session",
    "email_verification_request",
    "password_reset_session",
  ],
});
