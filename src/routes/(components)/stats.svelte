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
  import { browser } from "$app/environment";
  import { convertEnergy, getEnergyUnit } from "$/utils/converter/energy";
  import { type Format } from "@number-flow/svelte";
  import type { Stats } from "$/types/stats";

  const FALLBACK_STATS: Stats = {
    userCount: 0,
    energyUsed: { total: 0, energyUnit: "kWh", formatted: "" },
    billingCount: 0,
    paymentsAmount: { total: 0, formatted: "" },
  };

  const statsQuery = browser ? getStats() : null;

  // `current` is the snapshot value returned by the one-shot query. Accessing it
  // in a `$derived` keeps the UI reactive; the value refreshes on page reload.
  const stats = $derived(statsQuery?.current ?? FALLBACK_STATS);

  const statsList = $derived<StatsList[]>([
    {
      value: stats.userCount,
      format: {
        style: "decimal",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: "Active Users",
    },
    {
      value: convertEnergy(stats.energyUsed.total, stats.energyUsed.energyUnit),
      format: {
        style: "decimal",
        maximumFractionDigits: 2,
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: getEnergyUnit(stats.energyUsed.total),
      label: "Energy Tracked",
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

<section class="relative z-10 py-20 lg:py-28">
  <div class="container mx-auto px-4">
    <div class="overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur">
      <div class="flex items-center justify-between border-b border-border/70 px-6 py-4">
        <div
          class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase"
        >
          <span class="size-1.5 animate-pulse rounded-full bg-primary"></span>
          Live stats
        </div>
        <span class="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
          Updated on load
        </span>
      </div>

      <ScrollStagger
        preset="slide-up"
        stagger={0.08}
        duration={0.6}
        distance={24}
        class="grid grid-cols-2 gap-px bg-border/70 lg:grid-cols-4"
      >
        {#each statsList as stat (stat.label)}
          <div class="bg-card p-6 lg:p-8">
            <p class="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p class="mt-3 text-3xl font-semibold text-primary tabular-nums md:text-4xl">
              <NumberTicker
                format={stat.format}
                suffix={stat.suffix}
                prefix={stat.prefix}
                value={stat.value}
                class="text-primary [&::part(suffix)]:ml-2"
              />
            </p>
          </div>
        {/each}
      </ScrollStagger>
    </div>
  </div>
</section>
