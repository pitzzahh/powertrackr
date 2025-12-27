<script lang="ts" module>
    export type BarChartData = {
        date: Date;
        totalKWh: number;
        mainKWh: number;
        subKWh: number;
    };

    export type BarChartInteractiveProps = {
        chartData: BarChartData[];
    };

    type ChartBarState = {
        timeRange: "7d" | "30d" | "90d" | "6m" | "1y" | "all";
        activeChart: string;
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
    import { BarChart, Highlight } from "layerchart";
    import { scaleBand } from "d3-scale";
    import { cubicInOut } from "svelte/easing";
    import { formatDate } from "$/utils/format";
    import { TIME_RANGE_OPTIONS } from ".";

    let { chartData }: BarChartInteractiveProps = $props();

    const sortedData = $derived(
        [...chartData].sort((a, b) => a.date.getTime() - b.date.getTime()),
    );

    let { timeRange, activeChart }: ChartBarState = $state({
        timeRange: "all",
        activeChart: "totalKWh",
    });

    const { selectedLabel, filteredData } = $derived({
        selectedLabel: () => {
            switch (timeRange) {
                case "7d":
                    return "Last 7 days";
                case "30d":
                    return "Last 30 days";
                case "90d":
                    return "Last 3 months";
                case "6m":
                    return "Last 6 months";
                case "1y":
                    return "Last year";
                case "all":
                    return "Show All";
                default:
                    return "Last 3 months";
            }
        },
        filteredData: () => {
            if (timeRange === "all") return sortedData;
            let daysToSubtract = 90;
            if (timeRange === "30d") {
                daysToSubtract = 30;
            } else if (timeRange === "7d") {
                daysToSubtract = 7;
            } else if (timeRange === "6m") {
                daysToSubtract = 180;
            } else if (timeRange === "1y") {
                daysToSubtract = 365;
            }

            const maxDate =
                sortedData.length > 0
                    ? sortedData[sortedData.length - 1].date
                    : new Date();
            const referenceDate = new Date(
                maxDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000,
            );
            return sortedData.filter((item) => item.date >= referenceDate);
        },
    });

    const total = $derived({
        totalKWh: filteredData().reduce((acc, curr) => acc + curr.totalKWh, 0),
        mainKWh: filteredData().reduce((acc, curr) => acc + curr.mainKWh, 0),
        subKWh: filteredData().reduce((acc, curr) => acc + curr.subKWh, 0),
    });

    const activeSeries = $derived(
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
                      label: CHART_CONFIG[
                          activeChart as keyof typeof CHART_CONFIG
                      ].label,
                      color: CHART_CONFIG[
                          activeChart as keyof typeof CHART_CONFIG
                      ].color,
                  },
              ],
    );
</script>

<Card.Root class="pb-6 pt-0">
    <Card.Header
        class="flex flex-col items-stretch space-y-0 border-b [.border-b]:pb-0 p-0 sm:flex-row h-fit"
    >
        <div
            class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6"
        >
            <Card.Title>Energy Usage</Card.Title>
            <Card.Description>Showing kWh usage over time</Card.Description>
        </div>
        <div class="grid sm:grid-cols-2 md:grid-cols-4 h-fit">
            {#each ["totalKWh", "mainKWh", "subKWh", "all"] as key (key)}
                {@const chart = key}
                <button
                    data-active={activeChart === chart}
                    class="data-[active=true]:bg-muted/50 data-[active=true]:border-2 data-[active=true]:border-primary/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
                    onclick={() => (activeChart = key)}
                >
                    <span
                        class="text-xs {activeChart === chart
                            ? 'text-primary'
                            : 'text-muted-foreground'}"
                    >
                        {key === "all"
                            ? "All"
                            : CHART_CONFIG[key as keyof typeof CHART_CONFIG]
                                  .label}
                    </span>
                    <span class="text-lg leading-none font-bold sm:text-3xl">
                        {key === "all"
                            ? (
                                  total.totalKWh +
                                  total.mainKWh +
                                  total.subKWh
                              ).toLocaleString()
                            : total[key as keyof typeof total].toLocaleString()}
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
                    {selectedLabel()}
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
        {#if filteredData().length > 0}
            <Chart.Container
                config={CHART_CONFIG}
                class="aspect-auto h-62.5 w-full"
            >
                <BarChart
                    data={filteredData()}
                    x="date"
                    xScale={scaleBand().padding(0.25)}
                    series={activeSeries}
                    seriesLayout="group"
                    props={{
                        bars: {
                            stroke: "none",
                            rounded: "none",
                            initialY: 0,
                            initialHeight: 0,
                            motion: {
                                y: {
                                    type: "tween",
                                    duration: 300,
                                    easing: cubicInOut,
                                },
                                height: {
                                    type: "tween",
                                    duration: 300,
                                    easing: cubicInOut,
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
                        ...(activeChart === "all"
                            ? {
                                  seriesLayout: "stack",
                              }
                            : {}),
                    }}
                >
                    {#snippet belowMarks()}
                        <Highlight area={{ class: "fill-muted" }} />
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
