<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    eyebrow,
    title,
    description,
    children,
  }: {
    /** Mono uppercase label with a volt tick — the instrument-panel voice */
    eyebrow?: string;
    title: string;
    description?: string;
    /** Right-aligned actions (e.g. an "Add" button) */
    children?: Snippet;
  } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div class="space-y-1.5">
    {#if eyebrow}
      <p
        class="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.3em] text-primary uppercase"
      >
        <span class="inline-block h-3 w-0.5 rounded-full bg-primary" aria-hidden="true"></span>
        {eyebrow}
      </p>
    {/if}
    <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
    {#if description}
      <p class="text-muted-foreground">{description}</p>
    {/if}
  </div>
  {#if children}
    <div class="shrink-0">{@render children()}</div>
  {/if}
</div>
