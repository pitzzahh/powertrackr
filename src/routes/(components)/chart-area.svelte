<script lang="ts" module>
  export type ChartData = {
    date: Date;
    balance: number;
    payment: number;
    subPayments: { [label: string]: number };
  };

  export type AreaChartInteractiveProps = {
    chartData: ChartData[];
    status: Status;
    retryStatus?: Status;
    refetch?: (callback: () => void) => void;
  };
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import * as Chart from "$/components/ui/chart/index.js";
  import * as Card from "$/components/ui/card/index.js";
  import * as Select from "$/components/ui/select/index.js";
  import { scaleUtc } from "d3-scale";
  import { Spline, LineChart, Points } from "layerchart";
  import { curveLinear } from "d3-shape";
  import ChartContainer from "$/components/ui/chart/chart-container.svelte";
  import { expoInOut } from "svelte/easing";
  import { formatDate, formatNumber } from "$/utils/format";
  import { TIME_RANGE_OPTIONS, getSelectedLabel, getFilteredData } from ".";
  import { Loader, RefreshCw } from "$lib/assets/icons";
  import { Button } from "$/components/ui/button";
  import type { Status } from "$/types/state";
  import { SvelteSet } from "svelte/reactivity";
  import { onMount, untrack } from "svelte";
  let { chartData, status, retryStatus, refetch }: AreaChartInteractiveProps = $props();

  let { timeRange, visibleKeysSet } = $state({
    timeRange: "all",
    visibleKeysSet: new SvelteSet<string>(),
  });

  let { visibleKeys, filteredData, selectedLabel, uniqueLabels } = $derived({
    visibleKeys: Array.from(visibleKeysSet),
    filteredData: getFilteredData(chartData, timeRange),
    selectedLabel: getSelectedLabel(timeRange),
    uniqueLabels: Array.from(new Set(chartData.flatMap((d) => Object.keys(d.subPayments)))),
  });

  const { transformedData, CHART_CONFIG } = $derived({
    transformedData: filteredData.map((d) => ({
      date: d.date,
      balance: d.balance,
      payment: d.payment,
      ...d.subPayments,
    })),
    CHART_CONFIG: {
      balance: { label: "Balance", color: "var(--chart-1)" },
      payment: { label: "Payment", color: "var(--chart-2)" },
      ...Object.fromEntries(
        uniqueLabels.map((label, index) => [label, { label, color: `var(--chart-${index + 3})` }])
      ),
    },
  });

  $effect(() =>
    untrack(() => {
      const keys = Object.keys(CHART_CONFIG);
      for (const key of keys) {
        if (!visibleKeysSet.has(key)) {
          visibleKeysSet.add(key);
        }
      }
      // Remove keys that are no longer in config
      for (const key of Array.from(visibleKeysSet)) {
        if (!keys.includes(key)) {
          visibleKeysSet.delete(key);
        }
      }
    })
  );
</script>

<Card.Root>
  <Card.Header class="flex flex-col gap-2 space-y-0 border-b md:flex-row md:items-center">
    <div class="grid flex-1 gap-1">
      <Card.Title>Billing Trends</Card.Title>
      <Card.Description>Showing billing info over time</Card.Description>
    </div>
    <Select.Root type="single" bind:value={timeRange}>
      <Select.Trigger class="ms-auto w-40 rounded-lg" aria-label="Select a value">
        {selectedLabel}
      </Select.Trigger>
      <Select.Content class="rounded-xl">
        {#each TIME_RANGE_OPTIONS as option (option.value)}
          <Select.Item value={option.value} class="rounded-lg">
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Card.Header>
  <Card.Content class="pl-16">
    {#if status === "fetching"}
      <div class="flex flex-col items-center justify-center py-8">
        <Loader class="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
        <p class="text-muted-foreground">Fetching data...</p>
      </div>
    {:else if status === "error"}
      <div class="flex flex-col items-center justify-center">
        <p class="py-8 text-center text-muted-foreground">Error loading data.</p>
        <Button
          onclick={() => {
            retryStatus = "fetching";
            refetch?.(() => (retryStatus = "success"));
          }}
          ><RefreshCw
            class={[
              {
                "animate-spin": retryStatus === "fetching",
              },
            ]}
          /> Refetch</Button
        >
      </div>
    {:else if filteredData.length > 0 && browser}
      <ChartContainer config={CHART_CONFIG} class="-ml-3 aspect-auto h-62.5 w-full">
        <LineChart
          data={transformedData}
          x="date"
          xScale={scaleUtc()}
          series={Object.entries(CHART_CONFIG)
            .filter(([key]) => visibleKeys.includes(key))
            .map(([key, { label, color }]) => ({
              key,
              label,
              color,
            }))}
          props={{
            xAxis: {
              ticks: timeRange === "7d" ? 7 : undefined,
              format: (v) => {
                return v.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              },
            },
            yAxis: {
              format: (v) => formatNumber(v),
            },
          }}
        >
          {#snippet marks({ series, getSplineProps, getPointsProps })}
            {#each series as s, i (s.key)}
              <Spline
                {...getSplineProps(s, i)}
                curve={curveLinear}
                stroke-width={2}
                motion={{
                  type: "tween",
                  duration: 1000,
                  easing: expoInOut,
                }}
              />
              <Points
                {...getPointsProps(s, i)}
                r={3}
                fill="white"
                stroke={s.color}
                stroke-width={1}
                motion={{
                  type: "tween",
                  duration: 1000,
                  easing: expoInOut,
                }}
              />
            {/each}
          {/snippet}
          {#snippet tooltip()}
            <Chart.Tooltip
              formatAsCurrency={true}
              labelFormatter={(v: Date) => formatDate(v)}
              indicator="line"
            />
          {/snippet}
        </LineChart>
      </ChartContainer>
      <div class="mt-4 flex flex-wrap justify-center gap-4">
        {#each Object.entries(CHART_CONFIG) as [key, { label, color }] (key)}
          <button
            class="flex items-center gap-2 text-sm"
            style="opacity: {visibleKeys.includes(key) ? 1 : 0.5};"
            onclick={() => {
              if (visibleKeysSet.has(key)) {
                visibleKeysSet.delete(key);
              } else {
                visibleKeysSet.add(key);
              }
            }}
          >
            <div style="background-color: {color};" class="size-3 rounded"></div>
            <span
              class={{
                "line-through": !visibleKeys.includes(key),
              }}>{label}</span
            >
          </button>
        {/each}
      </div>
    {:else}
      <p class="py-8 text-center text-muted-foreground">
        No data available for the selected time range.
      </p>
    {/if}
  </Card.Content>
</Card.Root>
