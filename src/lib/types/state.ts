import type { ExtendedBillingInfo } from "./billing-info";
import type { User } from "./user";

export type State = {
  currentRoute: string;
  user: User | null | undefined;
  history: ExtendedBillingInfo[] | undefined;
};

export type Status = "processing" | "loading_data" | "fetching" | "success" | "error" | "idle";
