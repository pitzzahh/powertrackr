import type { D1Database } from "@cloudflare/workers-types";

declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionValidationResult["user"];
      session: import("$lib/server/auth").SessionValidationResult["session"];
    }

    interface Platform {
      env: {
        DB: D1Database;
      };
    }
  }
}

export {};
