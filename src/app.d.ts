/// <reference types="../worker-configuration.d.ts" />

import type { TurnstileApi } from "$lib/utils/turnstile";

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }

  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionValidationResult["user"];
      session: import("$lib/server/auth").SessionValidationResult["session"];
    }

    interface Platform {
      env: Env;
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
