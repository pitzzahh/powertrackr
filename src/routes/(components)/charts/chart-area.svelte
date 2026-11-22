<script lang="ts" module>
  export type AreaChartInteractiveProps = {
    chartData: AreaChartData[];
    status: AsyncState;
    asyncState?: AsyncState;
    refetch?: (callback: () => void) => void;
    /** Bound to the page: every chart on it shares one range, whichever card sets it. */
    timeRange: TimeRangeOption["value"];
  };

  type ChartAreaState = {
    visibleKeysSet: SvelteSet<string>;
  };

  /** Tenant series that fit in chart slots 3-8; more fold into OTHER_KEY. */
  const MAX_TENANT_SERIES = 6;
  const OTHER_KEY = "__other_tenants";
</script>

<script lang="ts">
  import { browser } from "$app/env";
  import * as Chart from "#lib/components/ui/chart/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { scaleUtc } from "d3-scale";
  import { Spline, LineChart, Points } from "layerchart";
  import { curveLinear } from "d3-shape";
  import ChartContainer from "#lib/components/ui/chart/chart-container.svelte";
  import { expoInOut } from "svelte/easing";
  import { formatDate, formatNumber } from "#lib/utils/format.js";
  import { getFilteredData } from ".";
  import TimeRangeSelect from "./time-range-select.svelte";
  import { Loader, RefreshCw } from "#lib/assets/icons.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import type { AsyncState } from "#lib/types/state.js";
  import type { AreaChartData } from "#lib/types/chart.js";
  import { SvelteSet } from "svelte/reactivity";
  import type { TimeRangeOption } from "#lib/types/chart.js";

  let {
    chartData,
    status,
    asyncState,
    refetch,
    timeRange = $bindable(),
  }: AreaChartInteractiveProps = $props();

  const filteredData = $derived(getFilteredData(chartData, timeRange));

  // 8 validated colour slots: Balance, Payment, then 6 for tenants. Past that the
  // tail folds into one "Other tenants" series instead of reusing a colour.
  // Colours follow first appearance over ALL data, so filtering never repaints a tenant.
  const tenantLabels = $derived(
    Array.from(new Set(chartData.flatMap((d) => Object.keys(d.subPayments))))
  );
  const shownTenants = $derived(
    tenantLabels.length > MAX_TENANT_SERIES
      ? tenantLabels.slice(0, MAX_TENANT_SERIES - 1)
      : tenantLabels
  );

  const { transformedData, CHART_CONFIG } = $derived({
    transformedData: filteredData.map((d) => {
      const shown = Object.fromEntries(
        shownTenants.filter((t) => t in d.subPayments).map((t) => [t, d.subPayments[t]])
      );
      const otherSum = Object.entries(d.subPayments)
        .filter(([t]) => !shownTenants.includes(t))
        .reduce((sum, [, amount]) => sum + amount, 0);
      return {
        date: d.date,
        balance: d.balance,
        payment: d.payment,
        ...shown,
        ...(tenantLabels.length > shownTenants.length ? { [OTHER_KEY]: otherSum } : {}),
      };
    }),
    CHART_CONFIG: {
      balance: { label: "Balance", color: "var(--chart-1)" },
      payment: { label: "Payment", color: "var(--chart-2)" },
      ...Object.fromEntries(
        shownTenants.map((label, index) => [label, { label, color: `var(--chart-${index + 3})` }])
      ),
      ...(tenantLabels.length > shownTenants.length
        ? { [OTHER_KEY]: { label: "Other tenants", color: "var(--chart-8)" } }
        : {}),
    },
  });

  const { visibleKeysSet } = $derived<ChartAreaState>({
    visibleKeysSet: new SvelteSet<string>(Object.keys(CHART_CONFIG)),
  });

  const activeSeriesKeys = $derived(
    Object.keys(CHART_CONFIG).filter((key) => visibleKeysSet.has(key))
  );
</script>

<Card.Root>
  <Card.Header class="flex flex-col gap-2 space-y-0 border-b md:flex-row md:items-center">
    <div class="grid flex-1 gap-1">
      <Card.Title>Billing Trends</Card.Title>
      <Card.Description>Showing billing info over time</Card.Description>
    </div>
    <TimeRangeSelect bind:value={timeRange} class="md:ms-auto" />
  </Card.Header>
  <Card.Content class="pl-16">
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
            asyncState = "fetching";
            refetch?.(() => (asyncState = "success"));
          }}
        >
          <RefreshCw class={[{ "animate-spin": asyncState === "fetching" }]} />

          Refetch
        </Button>
      </div>
    {:else if filteredData.length > 0 && browser}
      <ChartContainer config={CHART_CONFIG} class="-ml-3 aspect-auto h-62.5 w-full">
        <LineChart
          data={transformedData}
          x="date"
          xScale={scaleUtc()}
          series={Object.entries(CHART_CONFIG)
            .filter(([key]) => visibleKeysSet.has(key))
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
          {#snippet marks()}
            {#each activeSeriesKeys as key (key)}
              <Spline
                seriesKey={key}
                curve={curveLinear}
                strokeWidth={2}
                motion={{
                  type: "tween",
                  duration: 1000,
                  easing: expoInOut,
                }}
              />
              <Points
                seriesKey={key}
                r={4}
                fill={CHART_CONFIG[key as keyof typeof CHART_CONFIG]?.color}
                strokeWidth={1}
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
            style="opacity: {visibleKeysSet.has(key) ? 1 : 0.5};"
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
                "line-through": !visibleKeysSet.has(key),
              }}
            >
              {label}
            </span>
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
