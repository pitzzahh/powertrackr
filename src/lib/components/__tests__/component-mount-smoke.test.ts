// @vitest-environment jsdom
import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vitest";
import ContextConsumer from "./fixtures/context-consumer.svelte";
import { setSmokeContext } from "./fixtures/smoke-context";

/**
 * Smoke test validating the component-testing pipeline (jsdom + svelte `mount`)
 * using the context wrapper pattern from the Svelte docs:
 * https://svelte.dev/docs/svelte/context#Component-testing
 */
describe("component mount (jsdom pipeline)", () => {
  it("mounts a component whose context is provided by a wrapper and unmounts cleanly", () => {
    function Wrapper(...args: Parameters<typeof ContextConsumer>) {
      setSmokeContext({ name: "Bob" });
      return ContextConsumer(...args);
    }

    const component = mount(Wrapper, { target: document.body });
    flushSync();

    expect(document.body.innerHTML).toBe("<h1>Hello Bob!</h1>");

    unmount(component);
    expect(document.body.innerHTML).toBe("");
  });
});
