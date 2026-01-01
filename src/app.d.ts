import type { User } from "$/server/db/schema/user.js";
import type { Session } from "$/server/db/schema/session.js";

declare global {
  namespace App {
    interface Locals {
      session?: Session;
      user?: User;
    }
  }
}

export {};
