/// <reference types="../worker-configuration" />

declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionValidationResult["user"];
      session: import("$lib/server/auth").SessionValidationResult["session"];
    }

    interface Platform {
      env: {
        DB: D1Database;
        RATE_LIMITER: RateLimit;
        EMAIL_RATE_LIMITER: RateLimit;
        REGISTRATION_RATE_LIMITER: RateLimit;
        LOGIN_RATE_LIMITER: RateLimit;
      };
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
