/// <reference types="../worker-configuration.d.ts" />

import type { TurnstileApi } from "#lib/utils/turnstile.js";

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }

  namespace App {
    interface Locals {
      user: import("#lib/server/auth.js").SessionValidationResult["user"];
      session: import("#lib/server/auth.js").SessionValidationResult["session"];
    }

    interface Platform {
      env: Env;
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
