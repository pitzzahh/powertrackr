import { Context } from "runed";

export const pendingFetchContext = new Context<{
  add: () => void;
  delete: () => void;
  count: number;
  reset: () => void;
}>("pending-fetch");
