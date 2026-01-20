<script lang="ts" module>
  export type ConsumptionChartData = {
    date: Date;
    kWh: number;
  };

  export type ConsumptionChartProps = {
    chartData: ConsumptionChartData[];
    status: Status;
    retryStatus?: Status;
    refetch?: (callback: () => void) => void;
  };
</script>

<script lang="ts">
  import * as Chart from "$/components/ui/chart/index.js";
  import * as Card from "$/components/ui/card/index.js";
  import { scaleUtc } from "d3-scale";
  import { LineChart } from "layerchart";
  import { curveStep } from "d3-shape";
  import { Loader, RefreshCw } from "$lib/assets/icons";
  import { Button } from "$/components/ui/button";
  import { formatNumber } from "$/utils/format";
  import { browser } from "$app/environment";
  import type { Status } from "$/types/state";

  let { chartData, status, retryStatus, refetch }: ConsumptionChartProps = $props();

  const CHART_CONFIG = {
    kWh: { label: "kWh", color: "var(--chart-1)" },
  };

  const sortedData = $derived([...chartData].sort((a, b) => a.date.getTime() - b.date.getTime()));
</script>

<Card.Root>
  <Card.Header class="flex flex-col gap-2 space-y-0 border-b md:flex-row md:items-center">
    <div class="grid flex-1 gap-1">
      <Card.Title>kWh Consumption Over Time</Card.Title>
      <Card.Description>Historical energy usage</Card.Description>
    </div>
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
    {:else if chartData.length > 0 && browser}
      <Chart.Container config={CHART_CONFIG}>
        <LineChart
          data={sortedData}
          x="date"
          xScale={scaleUtc()}
          series={[
            {
              key: "kWh",
              label: "kWh",
              color: CHART_CONFIG.kWh.color,
            },
          ]}
          props={{
            spline: { curve: curveStep, motion: "tween", strokeWidth: 2 },
            xAxis: {
              format: (v: Date) => v.toLocaleDateString("en-US", { month: "short" }),
            },
            yAxis: {
              format: (v) => formatNumber(v),
            },
            highlight: { points: { r: 4 } },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip hideLabel />
          {/snippet}
        </LineChart>
      </Chart.Container>
    {:else}
      <p class="py-8 text-center text-muted-foreground">No data available.</p>
    {/if}
  </Card.Content>
</Card.Root>
