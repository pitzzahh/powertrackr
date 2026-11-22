<script lang="ts" module>
  export type TurnstileWidgetProps = {
    siteKey?: string;
    /** The current challenge token; "" until solved or after a reset. */
    token?: string;
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { loadTurnstileScript } from "#lib/utils/turnstile.js";

  let { siteKey, token = $bindable("") }: TurnstileWidgetProps = $props();

  let widgetId: string | null = null;
  let container = $state<HTMLDivElement | null>(null);

  // Turnstile is an external widget: mount it once the script loads, remove on destroy
  onMount(() => {
    if (!siteKey) return;
    void loadTurnstileScript().then(render);
    return () => {
      if (widgetId !== null) window.turnstile?.remove(widgetId);
    };
  });

  /**
   * Tokens are single-use: after any failed submit the widget must mint a
   * fresh challenge, otherwise the retry is rejected as `timeout-or-duplicate`.
   */
  export function reset() {
    token = "";
    if (widgetId !== null) window.turnstile?.reset(widgetId);
  }

  function render() {
    if (widgetId !== null || container === null || !siteKey || !window.turnstile) return;
    widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: "turnstile-spin-v2",
      theme: "auto",
      // Full form width instead of the default centered 300px box
      size: "flexible",
      // The widget would otherwise inject its own `<input name="cf-turnstile-response">`;
      // dashed keys crash SvelteKit remote-form preflight ("Invalid path ...").
      // The token flows through the callback into the form's own hidden input.
      "response-field": false,
      callback: (value) => {
        token = value;
      },
      "expired-callback": () => reset(),
      "error-callback": () => {
        token = "";
      },
    });
  }
</script>

<div
  class="cf-turnstile"
  data-sitekey={siteKey}
  data-action="turnstile-spin-v2"
  bind:this={container}
></div>
