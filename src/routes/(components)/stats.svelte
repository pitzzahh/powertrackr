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
  import { NumberTicker } from "$lib/components/ui/number-ticker";
  import type { Stats } from "$/types/stats";
  import { source } from "sveltekit-sse";
  import type { Unsubscriber } from "svelte/store";
  import { convertEnergy, getEnergyUnit } from "$/utils/converter/energy";
  import { type Format } from "@number-flow/svelte";

  const statsSource = source("/events/stats", { cache: false });
  let unsubscribe: Unsubscriber;

  let { stats, oldStats } = $state<{ stats: Stats; oldStats: Stats }>({
    stats: null!,
    oldStats: null!,
  });

  const statsList = $derived<StatsList[]>([
    {
      value: stats?.userCount,
      format: {
        style: "decimal",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: `Active ${stats?.userCount === 1 ? "User" : "Users"}`,
    },
    {
      value: convertEnergy(stats?.energyUsed.total, stats?.energyUsed.energyUnit ?? "kWh"),
      format: {
        style: "decimal",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: getEnergyUnit(stats?.energyUsed.total),
      label: `${stats?.energyUsed.energyUnit} Tracked`,
    },
    {
      value: stats?.billingCount,
      format: {
        style: "decimal",
        notation: "compact",
        trailingZeroDisplay: "stripIfInteger",
      },
      suffix: "+",
      label: "Bills Tracked",
    },
    {
      value: stats?.paymentsAmount.total,
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

  $effect(() => {
    unsubscribe = statsSource
      .select("stats")
      .json<Stats>()
      .subscribe((value) => {
        if (value) {
          stats = value;
          oldStats = stats;
        }
      });

    return () => {
      statsSource.close();
      unsubscribe();
    };
  });
</script>

<svelte:window
  onclose={() => {
    statsSource.close();
    unsubscribe();
  }}
/>

<section class="relative z-10 border-y border-border/50 bg-muted/30 py-20">
  <div class="container mx-auto px-4">
    <ScrollStagger
      preset="slide-up"
      stagger={0.1}
      duration={0.6}
      distance={30}
      class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
    >
      {#each statsList as stat, i (stat.label)}
        {@const initial = (() => {
          if (!oldStats) return 0;
          switch (i) {
            case 0:
              return oldStats.userCount;
            case 1:
              return convertEnergy(
                oldStats?.energyUsed.total,
                oldStats?.energyUsed.energyUnit ?? "kWh"
              );
            case 2:
              return oldStats.billingCount;
            case 3:
              return oldStats.paymentsAmount.total;
            default:
              return 0;
          }
        })()}
        <div class="text-center">
          <div class="mb-2 text-4xl font-bold text-primary md:text-5xl">
            <NumberTicker
              format={stat.format}
              suffix={stat.suffix}
              prefix={stat.prefix}
              value={initial + (stat.value - initial)}
              {...stat?.suffix != "+" && {
                class: "[&::part(suffix)]:ml-2",
              }}
            />
          </div>
          <div class="text-muted-foreground">
            {stat.label}
          </div>
        </div>
      {/each}
    </ScrollStagger>
  </div>
</section>
