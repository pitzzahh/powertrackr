<script lang="ts">
  import { chartStyleCss } from "./core";
  import type { ChartConfig } from "./context";

  let { id, config }: { id: string; config: ChartConfig } = $props();

  const css = $derived(chartStyleCss(id, config));
</script>

{#if css}
  {@html `<style>${css}</style>`}
{/if}
