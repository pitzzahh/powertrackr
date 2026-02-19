<script module lang="ts">
  function formatUserCount(count: number) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  }
  function formatBillingCount(count: number) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  }
</script>

<script lang="ts">
  import { ScrollStagger } from "$lib/motion-core";
  import { NumberTicker } from "$lib/components/ui/number-ticker";
  import { formatNumber, formatEnergy } from "$/utils/format";
  import type { Stats } from "$/types/stats";
  import { source } from "sveltekit-sse";
  import type { Unsubscriber } from "svelte/store";

  const statsSource = source("/events/stats", { cache: false });
  let unsubscribe: Unsubscriber;

  let { stats } = $state<{ stats: Stats }>({ stats: null! });

  const statsList = $derived([
    {
      value: stats?.userCount,
      format: formatUserCount,
      label: `Active ${stats?.userCount === 1 ? "User" : "Users"}`,
    },
    {
      value: stats?.energyUsed.total,
      format: (val: number) => formatEnergy(val),
      label: `${stats?.energyUsed.energyUnit} Tracked`,
    },
    {
      value: stats?.billingCount,
      format: formatBillingCount,
      label: "Bills Tracked",
    },
    {
      value: stats?.paymentsAmount.total,
      format: (val: number) => formatNumber(val),
      label: "Payments Managed",
    },
  ]);

  $effect(() => {
    unsubscribe = statsSource
      .select("stats")
      .json<Stats>()
      .subscribe((value) => {
        if (value) stats = value;
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
        <div class="text-center">
          <div class="mb-2 text-4xl font-bold text-primary md:text-5xl">
            {#key stat.value}
              <NumberTicker value={stat.value} format={stat.format} delay={0.3 + i * 0.1} />
            {/key}
          </div>
          <div class="text-muted-foreground">
            {stat.label}
          </div>
        </div>
      {/each}
    </ScrollStagger>
  </div>
</section>
