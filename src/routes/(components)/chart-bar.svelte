<script lang="ts" module>
  export type BarChartData = {
    date: Date;
    totalKWh: number;
    mainKWh: number;
    subKWh: number;
  };

  export type BarChartInteractiveProps = {
    chartData: BarChartData[];
    status: "fetching" | "fetched" | "error";
    retryStatus?: "fetching" | "fetched" | "error";
    refetch?: (callback: () => void) => void;
  };

  type ChartBarState = {
    timeRange: "7d" | "30d" | "90d" | "6m" | "1y" | "all";
    activeChart: "totalKWh" | "mainKWh" | "subKWh" | "all";
    context: ChartContextValue;
    totalKWh: number;
    mainKWh: number;
    subKWh: number;
  };

  const CHART_CONFIG = {
    totalKWh: { label: "Total kWh", color: "var(--chart-1)" },
    mainKWh: { label: "Main kWh", color: "var(--chart-2)" },
    subKWh: { label: "Sub kWh", color: "var(--chart-3)" },
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

  let { chartData, status, retryStatus, refetch }: BarChartInteractiveProps =
    $props();

  let {
    timeRange,
    activeChart,
    context,
    totalKWh,
    mainKWh,
    subKWh,
  }: ChartBarState = $state({
    timeRange: "all",
    activeChart: "all",
    context: null!,
    totalKWh: 0,
    mainKWh: 0,
    subKWh: 0,
  });

  const { selectedLabel, filteredData, activeSeries } = $derived({
    selectedLabel: getSelectedLabel(timeRange),
    filteredData: getFilteredData(chartData, timeRange),
    activeSeries:
      activeChart === "all"
        ? [
            {
              key: "totalKWh",
              label: "Total kWh",
              color: CHART_CONFIG.totalKWh.color,
            },
            {
              key: "mainKWh",
              label: "Main kWh",
              color: CHART_CONFIG.mainKWh.color,
            },
            {
              key: "subKWh",
              label: "Sub kWh",
              color: CHART_CONFIG.subKWh.color,
            },
          ]
        : [
            {
              key: activeChart,
              label:
                CHART_CONFIG[activeChart as keyof typeof CHART_CONFIG].label,
              color:
                CHART_CONFIG[activeChart as keyof typeof CHART_CONFIG].color,
            },
          ],
  });

  let worker: Worker | null = null;

  if (browser) {
    worker = new Worker(
      new URL("$lib/workers/total-calculator.ts", import.meta.url),
    );

    worker.onmessage = (e: MessageEvent<Total>) => {
      totalKWh = e.data.totalKWh;
      mainKWh = e.data.mainKWh;
      subKWh = e.data.subKWh;
    };
  }

  $effect(() => {
    if (browser && worker) {
      worker.postMessage({ data: filteredData });
    }
  });

  onDestroy(() => worker?.terminate());
</script>

<Card.Root class="pb-6 pt-0">
  <Card.Header
    class="flex flex-col items-stretch space-y-0 border-b [.border-b]:pb-0 p-0 sm:flex-row h-fit"
  >
    <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
      <Card.Title>Energy Usage</Card.Title>
      <Card.Description>Showing kWh usage over time</Card.Description>
    </div>
    <div class="grid sm:grid-cols-2 md:grid-cols-4 h-fit">
      {#each ["totalKWh", "mainKWh", "subKWh", "all"] as key (key)}
        {@const chart = key}
        <button
          data-active={activeChart === chart}
          class="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
          onclick={() => (activeChart = key as ChartBarState["activeChart"])}
        >
          <span
            class="text-xs {activeChart === chart
              ? 'text-primary'
              : 'text-muted-foreground'}"
          >
            {key === "all"
              ? "All"
              : CHART_CONFIG[key as keyof typeof CHART_CONFIG].label}
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
              ? (totalKWh + mainKWh + subKWh).toLocaleString()
              : (key === "totalKWh"
                  ? totalKWh
                  : key === "mainKWh"
                    ? mainKWh
                    : subKWh
                ).toLocaleString()}
          </span>
        </button>
      {/each}
    </div>
  </Card.Header>
  <Card.Content>
    <div class="flex justify-end mb-4">
      <Select.Root type="single" bind:value={timeRange}>
        <Select.Trigger
          class="w-40 rounded-lg"
          aria-label="Select a time range"
        >
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
      <div class="flex flex-col justify-center items-center py-8">
        <Loader class="animate-spin h-8 w-8 text-muted-foreground mb-2" />
        <p class="text-muted-foreground">Fetching data...</p>
      </div>
    {:else if status === "error"}
      <div class="flex items-center flex-col justify-center">
        <p class="text-center text-muted-foreground py-8">
          Error loading data.
        </p>
        <Button
          onclick={() => {
            retryStatus = "fetching";
            refetch?.(() => (retryStatus = "fetched"));
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
            <Chart.Tooltip
              nameKey="kWh"
              labelFormatter={(v: Date) => formatDate(v)}
            />
          {/snippet}
        </BarChart>
      </Chart.Container>
    {:else}
      <p class="text-center text-muted-foreground py-8">
        No data available for the selected time range.
      </p>
    {/if}
  </Card.Content>
</Card.Root>
