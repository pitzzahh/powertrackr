<script lang="ts" module>
  import type { BarChartData } from "#lib/types/chart.js";

  export type { BarChartData };

  export type BarChartInteractiveProps = {
    chartData: BarChartData[];
    status: AsyncState;
    retryStatus?: AsyncState;
    refetch?: (callback: () => void) => void;
    /** Bound to the page: every chart on it shares one range, whichever card sets it. */
    timeRange: TimeRangeOption["value"];
  };

  type ChartBarState = {
    activeChart: "totalkWh" | "mainKWh" | "subkWh" | "all";
    context: ChartState;
  };

  const CHART_CONFIG = {
    totalkWh: { label: "Total", color: "var(--chart-1)" },
    mainKWh: { label: "Main", color: "var(--chart-2)" },
    subkWh: { label: "Sub", color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig;
</script>

<script lang="ts">
  import * as Chart from "#lib/components/ui/chart/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { BarChart, type ChartState } from "layerchart";
  import { scaleBand } from "d3-scale";
  import { quintInOut } from "svelte/easing";
  import { formatDate, formatNumber, formatEnergy } from "#lib/utils/format.js";
  import { getFilteredData } from ".";
  import TimeRangeSelect from "./time-range-select.svelte";
  import { browser } from "$app/env";
  import type { Total } from "#lib/types/chart.js";
  import { Loader, RefreshCw } from "#lib/assets/icons.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import type { AsyncState } from "#lib/types/state.js";
  import type { TimeRangeOption } from "#lib/types/chart.js";
  import { getEnergyUnit, convertEnergy } from "#lib/utils/converter/energy.js";
  import { NumberTicker } from "#lib/components/number-ticker/index.js";
  import type { Format } from "@number-flow/svelte";
  import { cn } from "#lib/utils/style.js";

  let {
    chartData,
    status,
    retryStatus,
    refetch,
    timeRange = $bindable(),
  }: BarChartInteractiveProps = $props();

  let { activeChart, context }: ChartBarState = $state({
    activeChart: "all",
    context: null!,
  });

  const { filteredData, activeSeries } = $derived({
    filteredData: getFilteredData(chartData, timeRange),
    activeSeries:
      activeChart === "all"
        ? [
            // Main + Sub stacked: the stack height is the total, so Total is not drawn again.
            {
              key: "mainKWh",
              label: CHART_CONFIG.mainKWh.label,
              color: CHART_CONFIG.mainKWh.color,
            },
            {
              key: "subkWh",
              label: CHART_CONFIG.subkWh.label,
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

  const { totalkWh, mainKWh, subkWh }: Total = $derived(
    filteredData.reduce(
      (acc, d) => ({
        totalkWh: acc.totalkWh + d.totalkWh,
        mainKWh: acc.mainKWh + d.mainKWh,
        subkWh: acc.subkWh + d.subkWh,
      }),
      { totalkWh: 0, mainKWh: 0, subkWh: 0 }
    )
  );

  const chartUnit = $derived(
    getEnergyUnit(
      filteredData.reduce(
        (m, d) => Math.max(m, d?.totalkWh || 0, d?.mainKWh || 0, d?.subkWh || 0),
        0
      )
    )
  );

  const chartDivisor = $derived.by(() =>
    chartUnit === "TWh"
      ? 1_000_000_000
      : chartUnit === "GWh"
        ? 1_000_000
        : chartUnit === "MWh"
          ? 1_000
          : 1
  );

  const scaledData = $derived(
    filteredData.map((d) => ({
      date: d.date,
      totalkWh: (d.totalkWh || 0) / chartDivisor || 0,
      mainKWh: (d.mainKWh || 0) / chartDivisor || 0,
      subkWh: (d.subkWh || 0) / chartDivisor || 0,
    }))
  );
</script>

<Card.Root class="pt-0 pb-6">
  <Card.Header
    class="flex h-fit flex-col items-stretch space-y-0 border-b p-0 sm:flex-row [.border-b]:pb-0"
  >
    <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
      <!-- Picker on the title line, as in Billing Trends, so the header stays compact. -->
      <div class="flex items-start justify-between gap-3">
        <div class="grid gap-1">
          <Card.Title>Energy Usage</Card.Title>
          <Card.Description>Showing {chartUnit} usage over time</Card.Description>
        </div>
        <TimeRangeSelect bind:value={timeRange} />
      </div>
    </div>
    <div class="grid h-fit grid-cols-2 md:grid-cols-4">
      {#each ["totalkWh", "mainKWh", "subkWh", "all"] as key (key)}
        {@const chart = key}
        {@const value =
          key === "all" || key === "totalkWh" ? totalkWh : key === "mainKWh" ? mainKWh : subkWh}
        {@const unit = getEnergyUnit(value)}
        {@const convertedValue = convertEnergy(value, unit)}
        {@const tickerFormat: Format = { style: "decimal", maximumFractionDigits: unit === "kWh" ? 0 : 2, trailingZeroDisplay: "stripIfInteger" }}
        <button
          data-active={activeChart === chart}
          class="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
          onclick={() => (activeChart = key as ChartBarState["activeChart"])}
        >
          <!-- The swatch makes this row the legend; the label keeps its text colour. -->
          <span
            class="flex items-center gap-1.5 text-xs {activeChart === chart
              ? 'text-accent-foreground'
              : 'text-muted-foreground'}"
          >
            {#if key !== "all"}
              <span
                class="size-2.5 rounded-[3px]"
                style:background-color={CHART_CONFIG[key as keyof typeof CHART_CONFIG].color}
              ></span>
            {/if}
            {key === "all"
              ? "All (Main + Sub)"
              : CHART_CONFIG[key as keyof typeof CHART_CONFIG].label}
          </span>
          <NumberTicker
            class={cn("text-lg leading-none font-bold transition-colors sm:text-3xl", {
              "text-accent-foreground": activeChart === chart,
            })}
            value={convertedValue}
            format={tickerFormat}
            suffix={unit}
          />
        </button>
      {/each}
    </div>
  </Card.Header>
  <Card.Content class="pl-12">
    {#if status === "loading_data" || status === "fetching"}
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
        >
          <RefreshCw class={[{ "animate-spin": retryStatus === "fetching" }]} />

          Refetch
        </Button>
      </div>
    {:else if filteredData.length > 0 && browser}
      <Chart.Container config={CHART_CONFIG} class="aspect-auto h-62.5 w-full">
        <BarChart
          bind:context
          data={scaledData}
          x="date"
          xScale={scaleBand().padding(0.25)}
          series={activeSeries}
          seriesLayout={activeChart === "all" ? "stack" : "group"}
          highlight={{ area: { class: "fill-black/10" } }}
          props={{
            bars: {
              // 2px surface gap between stacked segments instead of a border.
              stroke: "var(--card)",
              strokeWidth: 2,
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
            xAxis: {
              format: (d: Date) => {
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                });
              },
            },
            yAxis: {
              format: (v) => `${formatNumber(v, { style: "decimal" })} ${chartUnit}`,
            },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip unit={chartUnit} labelFormatter={(v: Date) => formatDate(v)} />
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
