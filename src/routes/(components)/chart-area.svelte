<script lang="ts" module>
    export type ChartData = {
        date: Date;
        balance: number;
        payment: number;
        subPayment: number;
    };

    export type AreaChartInteractiveProps = {
        chartData: ChartData[];
    };

    const CHART_CONFIG = {
        balance: { label: "Balance", color: "var(--chart-1)" },
        payment: { label: "Payment", color: "var(--chart-2)" },
        subPayment: { label: "Sub Payment", color: "var(--chart-3)" },
    } satisfies Chart.ChartConfig;
</script>

<script lang="ts">
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

    let { chartData }: AreaChartInteractiveProps = $props();

    let { timeRange, visibleKeys } = $state({
        timeRange: "all",
        visibleKeys: Object.keys(CHART_CONFIG),
    });

    const { selectedLabel, filteredData } = $derived({
        selectedLabel: getSelectedLabel(timeRange),
        filteredData: getFilteredData(chartData, timeRange),
    });
</script>

<Card.Root>
    <Card.Header
        class="flex md:items-center gap-2 space-y-0 border-b flex-col md:flex-row"
    >
        <div class="grid flex-1 gap-1">
            <Card.Title>Billing Trends</Card.Title>
            <Card.Description>Showing billing info over time</Card.Description>
        </div>
        <Select.Root type="single" bind:value={timeRange}>
            <Select.Trigger
                class="w-40 rounded-lg ms-auto"
                aria-label="Select a value"
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
    </Card.Header>
    <Card.Content class="ml-10">
        {#if filteredData.length > 0}
            <ChartContainer
                config={CHART_CONFIG}
                class="-ml-3 aspect-auto h-62.5 w-full"
            >
                <LineChart
                    data={filteredData}
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
            <div class="flex flex-wrap justify-center gap-4 mt-4">
                {#each Object.entries(CHART_CONFIG) as [key, { label, color }] (key)}
                    <button
                        class="flex items-center gap-2 text-sm"
                        onclick={() =>
                            (visibleKeys = visibleKeys.includes(key)
                                ? visibleKeys.filter((k) => k !== key)
                                : [...visibleKeys, key])}
                    >
                        <div
                            class="w-3 h-3 rounded"
                            style="background-color: {color}; opacity: {visibleKeys.includes(
                                key,
                            )
                                ? 1
                                : 0.5}"
                        ></div>
                        <span
                            class={visibleKeys.includes(key)
                                ? ""
                                : "line-through"}>{label}</span
                        >
                    </button>
                {/each}
            </div>
        {:else}
            <p class="text-center text-muted-foreground py-8">
                No data available for the selected time range.
            </p>
        {/if}
    </Card.Content>
</Card.Root>
