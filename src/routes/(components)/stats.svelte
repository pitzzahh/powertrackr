<script module lang="ts">
  type StatsList = {
    value: number;
    format: Format;
    suffix?: string;
    prefix?: string;
    label: string;
  };
</script>

<script lang="ts">
  import { ScrollStagger } from "$lib/motion-core";
  import { NumberTicker } from "$lib/components/number-ticker";
  import { getStats } from "$/api/stats.remote";
  import { convertEnergy, getEnergyUnit } from "$/utils/converter/energy";
  import { type Format } from "@number-flow/svelte";
  import type { Stats } from "$/types/stats";

  const FALLBACK_STATS: Stats = {
    userCount: 0,
    energyUsed: { total: 0, energyUnit: "kWh", formatted: "" },
    billingCount: 0,
    paymentsAmount: { total: 0, formatted: "" },
  };

  const statsQuery = getStats();

  // `current` is the latest value pushed by the live query. Accessing it in a
  // `$derived` keeps the UI reactive without effects; the framework keeps the
  // connection open only while this component uses the query.
  const stats = $derived(statsQuery.current ?? FALLBACK_STATS);

  // Drop the query's active use while the tab is hidden so the server stops
  // iterating (no polling CPU for invisible pages). Unmounting the section is
  // enough — SvelteKit disconnects the stream when nothing uses the query.
  let visible = $state(true);

  const statsList = $derived<StatsList[]>([
    {
      value: stats.userCount,
      format: {
        style: "decimal",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: `Active ${stats.userCount === 1 ? "User" : "Users"}`,
    },
    {
      value: convertEnergy(stats.energyUsed.total, stats.energyUsed.energyUnit),
      format: {
        style: "decimal",
        maximumFractionDigits: 2,
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: getEnergyUnit(stats.energyUsed.total),
      label: `${stats.energyUsed.energyUnit} Tracked`,
    },
    {
      value: stats.billingCount,
      format: {
        style: "decimal",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: "Bills Tracked",
    },
    {
      value: stats.paymentsAmount.total,
      format: {
        style: "currency",
        currency: "PHP",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: "Payments Managed",
    },
  ]);
</script>

<svelte:window
  onvisibilitychange={() => {
    visible = !document.hidden;
  }}
/>

{#if visible}
  <section class="relative z-10 py-20">
    <div class="container mx-auto px-4">
      <div
        class="mb-8 flex items-center gap-4 text-xs tracking-[0.3em] text-muted-foreground uppercase"
      >
        <span class="rounded-full border border-border/60 px-3 py-1 text-primary">Live stats</span>
        <span>Across PowerTrackr</span>
        <div class="h-px flex-1 bg-linear-to-r from-primary/30 via-white/10 to-transparent"></div>
      </div>

      <ScrollStagger
        preset="slide-up"
        stagger={0.1}
        duration={0.6}
        distance={30}
        class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {#each statsList as stat (stat.label)}
          <div
            class="relative overflow-hidden rounded-2xl border border-border/60 bg-background/60 p-6 backdrop-blur"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Metric</div>
              <span
                class="rounded-full border border-border/60 px-2 py-1 text-[10px] text-muted-foreground"
              >
                Live
              </span>
            </div>
            <div class="mt-4 text-3xl font-semibold text-primary md:text-4xl">
              <NumberTicker
                format={stat.format}
                suffix={stat.suffix}
                prefix={stat.prefix}
                value={stat.value}
                {...stat?.suffix != "+" && {
                  class: "[&::part(suffix)]:ml-2",
                }}
              />
            </div>
            <div class="mt-2 text-sm text-muted-foreground">
              {stat.label}
            </div>
            <div
              class="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
            ></div>
          </div>
        {/each}
      </ScrollStagger>
    </div>
  </section>
{/if}
