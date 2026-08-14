<script lang="ts">
  import { onMount } from "svelte";
  import { formatNumber, formatEnergy } from "#lib/utils/format.js";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { useConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import { Loader, Zap } from "#lib/assets/icons.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { ChartConsumption } from "#routes/(components)/index.js";
  import PageHeader from "#routes/(components)/page-header.svelte";
  import MetricsCard from "#routes/(components)/metrics-card.svelte";

  let { data } = $props();

  const consumptionStore = useConsumptionStore();

  onMount(() => {
    if (!data.user) {
      console.warn("No user available to fetch consumption data");
      return;
    }
    consumptionStore.setStatus("loading_data");
    consumptionStore.fetchData();
  });
</script>

<div class="space-y-6 pb-4">
  <PageHeader
    eyebrow="Monitoring"
    title="Consumption"
    description="Monitor your energy usage and sub-meter readings"
  />

  {@render Metrics()}

  <section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
    <ChartConsumption
      chartData={consumptionStore.extendedBillingInfos.map((info) => ({
        date: new Date(info.date),
        kWh: info.totalkWh,
      }))}
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
                    <p class="font-medium">{subMeter.tenantName}</p>
                    <p class="text-sm text-muted-foreground">
                      Reading: {formatNumber(subMeter.reading ?? 0, { style: "decimal" })}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{formatEnergy(subMeter.subkWh ?? 0)}</p>
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
  <div in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}>
    <MetricsCard
      icon={Zap}
      label="Total Consumption"
      hero={consumptionStore.status === "error"
        ? "0 kWh"
        : formatEnergy(consumptionStore.summary?.totalKWh || 0)}
      heroTone="primary"
      loading={consumptionStore.status === "fetching"}
      stats={[
        {
          label: "Average Daily",
          value: `${formatEnergy(consumptionStore.summary?.averageDailyKWh || 0)} /day`,
        },
        {
          label: "Sub-Meters",
          value: consumptionStore.summary?.totalSubMeters || 0,
        },
        {
          label: "Latest Consumption",
          value: formatEnergy(consumptionStore.summary?.latestReading || 0),
        },
      ]}
    />
  </div>
{/snippet}
