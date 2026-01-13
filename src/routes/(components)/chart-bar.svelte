<script lang="ts" module>
  export type BarChartData = {
    date: Date;
    totalkWh: number;
    mainKWh: number;
    subkWh: number;
  };

  export type BarChartInteractiveProps = {
    chartData: BarChartData[];
    status: Status;
    retryStatus?: Status;
    refetch?: (callback: () => void) => void;
  };

  type ChartBarState = {
    timeRange: "7d" | "30d" | "90d" | "6m" | "1y" | "all";
    activeChart: "totalkWh" | "mainKWh" | "subkWh" | "all";
    context: ChartContextValue;
    totalkWh: number;
    mainKWh: number;
    subkWh: number;
  };

  const CHART_CONFIG = {
    totalkWh: { label: "Total kWh", color: "var(--chart-1)" },
    mainKWh: { label: "Main kWh", color: "var(--chart-2)" },
    subkWh: { label: "Sub kWh", color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;
</script>

<script lang="ts">
  import * as Chart from "$/components/ui/chart/index.js";
  import * as Card from "$/components/ui/card/index.js";
  import * as Select from "$/components/ui/select/index.js";
  import { BarChart, Highlight, type ChartContextValue } from "layerchart";
  import { scaleBand } from "d3-scale";
  import { quintInOut } from "svelte/easing";
  import { formatDate } from "$/utils/format";
  import { TIME_RANGE_OPTIONS, getSelectedLabel, getFilteredData } from ".";
  import { browser } from "$app/environment";
  import type { Total } from "$lib/workers/total-calculator";
  import { onDestroy } from "svelte";
  import { Loader, RefreshCw } from "$lib/assets/icons";
  import { Button } from "$/components/ui/button";
  import type { Status } from "$/types/state";

  let { chartData, status, retryStatus, refetch }: BarChartInteractiveProps = $props();

  let { timeRange, activeChart, context, totalkWh, mainKWh, subkWh }: ChartBarState = $state({
    timeRange: "all",
    activeChart: "all",
    context: null!,
    totalkWh: 0,
    mainKWh: 0,
    subkWh: 0,
  });

  const { selectedLabel, filteredData, activeSeries } = $derived({
    selectedLabel: getSelectedLabel(timeRange),
    filteredData: getFilteredData(chartData, timeRange),
    activeSeries:
      activeChart === "all"
        ? [
            {
              key: "totalkWh",
              label: "Total kWh",
              color: CHART_CONFIG.totalkWh.color,
            },
            {
              key: "mainKWh",
              label: "Main kWh",
              color: CHART_CONFIG.mainKWh.color,
            },
            {
              key: "subkWh",
              label: "Sub kWh",
              color: CHART_CONFIG.subkWh.color,
            },
          ]
        : [
            {
              key: activeChart,
              label: CHART_CONFIG[activeChart as keyof typeof CHART_CONFIG].label,
              color: CHART_CONFIG[activeChart as keyof typeof CHART_CONFIG].color,
            },
          ],
  });

  let worker: Worker | null = null;

  if (browser) {
    worker = new Worker(new URL("$lib/workers/total-calculator.ts", import.meta.url));

    worker.onmessage = (e: MessageEvent<Total>) => {
      totalkWh = e.data.totalkWh;
      mainKWh = e.data.mainKWh;
      subkWh = e.data.subkWh;
    };
  }

  $effect(() => {
    if (browser && worker) {
      worker.postMessage({ data: filteredData });
    }
  });

  onDestroy(() => worker?.terminate());
</script>

<Card.Root class="pt-0 pb-6">
  <Card.Header
    class="flex h-fit flex-col items-stretch space-y-0 border-b p-0 sm:flex-row [.border-b]:pb-0"
  >
    <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
      <Card.Title>Energy Usage</Card.Title>
      <Card.Description>Showing kWh usage over time</Card.Description>
    </div>
    <div class="grid h-fit sm:grid-cols-2 md:grid-cols-4">
      {#each ["totalkWh", "mainKWh", "subkWh", "all"] as key (key)}
        {@const chart = key}
        <button
          data-active={activeChart === chart}
          class="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
          onclick={() => (activeChart = key as ChartBarState["activeChart"])}
        >
          <span class="text-xs {activeChart === chart ? 'text-primary' : 'text-muted-foreground'}">
            {key === "all" ? "All" : CHART_CONFIG[key as keyof typeof CHART_CONFIG].label}
          </span>
          <span
            class={[
              {
                "text-lg leading-none font-bold transition-colors sm:text-3xl": true,
                "text-primary": activeChart === chart,
              },
            ]}
          >
            {key === "all"
              ? (totalkWh + mainKWh + subkWh).toLocaleString()
              : (key === "totalkWh"
                  ? totalkWh
                  : key === "mainKWh"
                    ? mainKWh
                    : subkWh
                ).toLocaleString()}
          </span>
        </button>
      {/each}
    </div>
  </Card.Header>
  <Card.Content>
    <div class="mb-4 flex justify-end">
      <Select.Root type="single" bind:value={timeRange}>
        <Select.Trigger class="w-40 rounded-lg" aria-label="Select a time range">
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
    </div>
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
    {:else if filteredData.length > 0}
      <Chart.Container config={CHART_CONFIG} class="aspect-auto h-62.5 w-full">
        <BarChart
          bind:context
          data={filteredData}
          x="date"
          xScale={scaleBand().padding(0.25)}
          series={activeSeries}
          props={{
            bars: {
              stroke: "none",
              rounded: "none",
              initialY: context?.height,
              initialHeight: 0,
              motion: {
                y: {
                  type: "tween",
                  duration: 300,
                  easing: quintInOut,
                },
                height: {
                  type: "tween",
                  duration: 300,
                  easing: quintInOut,
                },
              },
            },
            highlight: { area: { fill: "none" } },
            xAxis: {
              format: (d: Date) => {
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                });
              },
            },
            yAxis: {
              format: (v) => v.toLocaleString(),
            },
          }}
        >
          {#snippet belowMarks()}
            <Highlight
              area={{
                class: "fill-black/10",
              }}
            />
          {/snippet}
          {#snippet tooltip()}
            <Chart.Tooltip nameKey="kWh" labelFormatter={(v: Date) => formatDate(v)} />
          {/snippet}
        </BarChart>
      </Chart.Container>
    {:else}
      <p class="py-8 text-center text-muted-foreground">
        No data available for the selected time range.
      </p>
    {/if}
  </Card.Content>
</Card.Root>
