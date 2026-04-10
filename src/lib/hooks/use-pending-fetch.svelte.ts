import { Context } from "runed";

export class PendingFetchState {
  #count = $state(0);

  add(): void {
    this.#count = this.#count + 1;
  }

  delete(): void {
    this.#count = Math.max(0, this.#count - 1);
  }

  reset(): void {
    this.#count = 0;
  }

  get count(): number {
    return this.#count;
  }
}

const ctx = new Context<PendingFetchState>("pending-fetch-ctx");

/**
 * Provider: create and set a PendingFetchState in context for a subtree.
 * Typically called in a root layout so the same instance is available app-wide.
 */
export function setPendingFetch(): PendingFetchState {
  return ctx.set(new PendingFetchState());
}

/**
 * Consumer: get the PendingFetchState from context.
 * @returns The PendingFetchState instance.
 */
export function usePendingFetch(): PendingFetchState {
  return ctx.get();
}
