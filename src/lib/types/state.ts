import type { User } from "$/server/db/schema/user";
import type { ExtendedBillingInfo } from "./billing-info";

export type State = {
  currentRoute: string;
  user: User | null | undefined;
  history: ExtendedBillingInfo[] | undefined;
};

export type Status = "loading_data" | "fetching" | "success" | "error" | "idle";
