import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";
import type { AsyncState } from "$/types/state.js";
import { getLatestBillingInfo } from "$/api/billing-info.remote";
import { getContext, setContext } from "svelte";

class LatestBillingState {
  latestBillingInfo = $state<BillingInfoDTOWithSubMeters | null>(null);
  status = $state<AsyncState>("idle");
  userId = $state<string>("");
  query = $derived(getLatestBillingInfo({ userId: this.userId }));

  setUserId(id: string) {
    this.userId = id;
  }

  setStatus(status: AsyncState) {
    this.status = status;
  }

  async refresh() {
    this.setStatus("fetching");
    return this.fetchData();
  }

  async fetchData() {
    try {
      const { value } = await this.query;
      this.latestBillingInfo = (value as BillingInfoDTOWithSubMeters[])[0] ?? null;
      this.status = "success";
    } catch (error) {
      console.error(error);
      this.status = "error";
      this.latestBillingInfo = null;
    }
  }
}

const SYMBOL_KEY = "latest-billing-store";

/**
 * Instantiates a new `LatestBillingState` instance and sets it in the context.
 *
 * @returns The `LatestBillingState` instance.
 */
export function setLatestBillingStore(): LatestBillingState {
  return setContext(Symbol.for(SYMBOL_KEY), new LatestBillingState());
}

/**
 * Retrieves the `LatestBillingState` instance from the context. This is a class instance,
 * so you cannot destructure it.
 * @returns The `LatestBillingState` instance.
 */
export function useLatestBillingStore(): LatestBillingState {
  return getContext(Symbol.for(SYMBOL_KEY));
}
