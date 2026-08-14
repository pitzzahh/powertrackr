<script lang="ts">
  import type { Component } from "svelte";
  import { cn } from "#lib/utils/style.js";
  import { Loader } from "#lib/assets/icons.js";

  export type MetricTone = "default" | "primary" | "success" | "destructive";

  export type MetricStat = {
    label: string;
    value: string | number;
    tone?: MetricTone;
    /** Small muted suffix, e.g. the percent change next to a delta */
    note?: string;
  };

  const TONE_CLASSES: Record<MetricTone, string> = {
    default: "",
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
  };

  let {
    icon: Icon,
    label,
    hero,
    heroTone = "default",
    loading = false,
    stats = [],
    class: className,
  }: {
    icon?: Component;
    label: string;
    /** Hero metric value (left zone) */
    hero: string | number;
    heroTone?: MetricTone;
    /** While loading, show loaders in the hero and every stat */
    loading?: boolean;
    /** Right-zone stats */
    stats?: MetricStat[];
    class?: string;
  } = $props();
</script>

<section class={cn("card-highlight rounded-md border bg-card shadow-sm", className)}>
  <div class="flex flex-col gap-6 p-6 xl:flex-row xl:items-center xl:gap-0">
    <div class="flex shrink-0 flex-col gap-1.5 xl:pr-10">
      <div class="flex items-center gap-2 text-muted-foreground">
        {#if Icon}
          <Icon class="size-4" aria-hidden="true" />
        {/if}
        <span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >{label}</span
        >
      </div>
      <div
        class={cn(
          "text-4xl font-bold tracking-tight tabular-nums lg:text-5xl",
          TONE_CLASSES[heroTone]
        )}
      >
        {#if loading}
          <Loader class="h-6 w-6 animate-spin" />
        {:else}
          {hero}
        {/if}
      </div>
    </div>

    {#if stats.length}
      <div
        class="grid flex-1 grid-cols-2 gap-x-8 gap-y-6 border-t pt-6 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] xl:border-t-0 xl:border-l xl:pt-0 xl:pl-10"
      >
        {#each stats as stat (stat.label)}
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </span>
            <div class="flex items-baseline gap-2">
              {#if loading}
                <Loader class="h-4 w-4 animate-spin" />
              {:else}
                <span
                  class={cn(
                    "text-xl font-semibold tabular-nums lg:text-2xl",
                    TONE_CLASSES[stat.tone ?? "default"]
                  )}>{stat.value}</span
                >
                {#if stat.note}
                  <span class="border-s border-border ps-2 text-xs text-muted-foreground"
                    >{stat.note}</span
                  >
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
