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
  import type { Stats } from "$/types/stats";
  import { source } from "sveltekit-sse";
  import type { Unsubscriber } from "svelte/store";
  import { convertEnergy, getEnergyUnit } from "$/utils/converter/energy";
  import { type Format } from "@number-flow/svelte";

  const statsSource = source("/events/stats");
  let unsubscribe: Unsubscriber | undefined;

  let { stats, oldStats } = $state<{ stats: Stats; oldStats: Stats }>({
    stats: {
      userCount: 0,
      energyUsed: { total: 0, energyUnit: "kWh", formatted: "" },
      billingCount: 0,
      paymentsAmount: { total: 0, formatted: "" },
    },
    oldStats: {
      userCount: 0,
      energyUsed: { total: 0, energyUnit: "kWh", formatted: "" },
      billingCount: 0,
      paymentsAmount: { total: 0, formatted: "" },
    },
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
        maximumFractionDigits: 2,
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

  function startSubscription() {
    if (unsubscribe) return;
    unsubscribe = statsSource
      .select("stats")
      .json<Stats>()
      .subscribe((value) => {
        if (value) {
          oldStats = stats;
          stats = value;
        }
      });
  }

  function stopSubscription() {
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (e) {
        console.warn(e);
      }
      unsubscribe = undefined;
    }
  }

  $effect(() => {
    startSubscription();
    return () => {
      stopSubscription();
      try {
        statsSource.close();
      } catch (e) {
        console.warn(e);
      }
    };
  });
</script>

<svelte:window
  onvisibilitychange={() => {
    if (document.hidden) {
      stopSubscription();
    } else {
      startSubscription();
    }
  }}
  onclose={() => {
    statsSource.close();
    stopSubscription();
  }}
/>

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
              value={initial + (stat.value - initial)}
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
