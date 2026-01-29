<script lang="ts">
  import { onMount } from "svelte";
  import { formatNumber, formatEnergy } from "$/utils/format";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { useConsumptionStore } from "$/stores/consumption.svelte.js";
  import { Loader, Zap } from "$lib/assets/icons";
  import * as Card from "$/components/ui/card";
  import { ChartConsumption } from "$routes/(components)";

  let { data } = $props();

  const consumptionStore = useConsumptionStore();

  const chartData = $derived(
    consumptionStore.extendedBillingInfos.map((info) => ({
      date: new Date(info.date),
      kWh: info.totalkWh,
    }))
  );

  onMount(() => {
    const userId = data?.user?.id;
    if (userId) {
      consumptionStore.setUserId(userId);
      consumptionStore.setStatus("loading_data");
      consumptionStore.fetchData();
    } else {
      console.warn("No user id available to fetch consumption data");
    }
  });
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Consumption</h1>
      <p class="text-muted-foreground">Monitor your energy usage and sub-meter readings</p>
    </div>
  </div>

  {@render Metrics()}

  <section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
    <ChartConsumption
      {chartData}
      status={consumptionStore.status}
      refetch={() => consumptionStore.fetchData()}
    />
  </section>

  <section in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
    <Card.Root>
      <Card.Header>
        <Card.Title>Sub-Meter Readings</Card.Title>
        <Card.Description>Latest readings from your sub-meters</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if consumptionStore.status === "fetching"}
          <div class="flex h-32 items-center justify-center">
            <Loader class="h-6 w-6 animate-spin" />
          </div>
        {:else if consumptionStore.status === "error"}
          <div class="flex items-center justify-center text-muted-foreground">
            Failed to load sub-meter data
          </div>
        {:else if consumptionStore.extendedBillingInfos.length > 0}
          <div class="space-y-4">
            {#each consumptionStore.extendedBillingInfos[0].subMeters as subMeter}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="flex items-center gap-3">
                  <Zap class="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p class="font-medium">{subMeter.label}</p>
                    <p class="text-sm text-muted-foreground">
                      Reading: {formatNumber(subMeter.reading, { style: "decimal" })}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{formatEnergy(subMeter.subkWh)}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex items-center justify-center text-muted-foreground">
            No sub-meter data available
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </section>
</div>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col justify-between gap-8 rounded-md border bg-card p-6 text-muted-foreground shadow-sm xl:flex-row xl:items-center"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Zap class="h-5 w-5" />
        <span class="text-lg">Total Consumption</span>
      </div>
      {#if consumptionStore.status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if consumptionStore.status === "error"}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">0 kWh</div>
      {:else}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">
          <span class="text-primary">{formatEnergy(consumptionStore.summary?.totalKWh || 0)}</span>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-8 md:grid-cols-3 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Average Daily</span>
        {#if consumptionStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if consumptionStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0 kWh</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatEnergy(consumptionStore.summary?.averageDailyKWh || 0)} /day</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Sub-Meters</span>
        {#if consumptionStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if consumptionStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{consumptionStore.summary?.totalSubMeters || 0}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Latest Consumption</span>
        {#if consumptionStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if consumptionStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatEnergy(consumptionStore.summary?.latestReading || 0)}</span
          >
        {/if}
      </div>
    </div>
  </section>
{/snippet}
