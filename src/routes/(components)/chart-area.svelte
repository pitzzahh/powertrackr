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
</script>

<script lang="ts">
    import * as Chart from "$/components/ui/chart/index.js";
    import * as Card from "$/components/ui/card/index.js";
    import * as Select from "$/components/ui/select/index.js";
    import { scaleUtc } from "d3-scale";
    import { Area, AreaChart, ChartClipPath } from "layerchart";
    import { curveStep } from "d3-shape";
    import ChartContainer from "$/components/ui/chart/chart-container.svelte";
    import { cubicInOut } from "svelte/easing";
    import { SvelteDate } from "svelte/reactivity";

    let { chartData }: AreaChartInteractiveProps = $props();

    let timeRange = $state("90d");

    const selectedLabel = $derived.by(() => {
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
    });

    const maxDate = $derived(
        chartData.length > 0
            ? new SvelteDate(
                  Math.max(
                      ...chartData.map((d: ChartData) => d.date.getTime()),
                  ),
              )
            : new Date(),
    );

    const filteredData = $derived.by(() => {
        if (timeRange === "all") return chartData;
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

        return chartData.filter((item: ChartData) => {
            const referenceDate = new SvelteDate(maxDate);
            referenceDate.setDate(referenceDate.getDate() - daysToSubtract);
            return item.date >= referenceDate;
        });
    });

    const chartConfig = {
        balance: { label: "Balance", color: "var(--chart-1)" },
        payment: { label: "Payment", color: "var(--chart-2)" },
        subPayment: { label: "Sub Payment", color: "var(--chart-3)" },
    } satisfies Chart.ChartConfig;
</script>

<Card.Root>
    <Card.Header
        class="flex md:items-center gap-2 space-y-0 border-b flex-col md:flex-row"
    >
        <div class="grid flex-1 gap-1">
            <Card.Title>Area Chart - Interactive</Card.Title>
            <Card.Description>Showing billing info over time</Card.Description>
        </div>
        <Select.Root type="single" bind:value={timeRange}>
            <Select.Trigger
                class="w-40 rounded-lg sm:ms-auto"
                aria-label="Select a value"
            >
                {selectedLabel}
            </Select.Trigger>
            <Select.Content class="rounded-xl">
                <Select.Item value="7d" class="rounded-lg"
                    >Last 7 days</Select.Item
                >
                <Select.Item value="30d" class="rounded-lg"
                    >Last 30 days</Select.Item
                >
                <Select.Item value="90d" class="rounded-lg"
                    >Last 3 months</Select.Item
                >
                <Select.Item value="6m" class="rounded-lg"
                    >Last 6 months</Select.Item
                >
                <Select.Item value="1y" class="rounded-lg"
                    >Last year</Select.Item
                >
                <Select.Item value="all" class="rounded-lg"
                    >Show All</Select.Item
                >
            </Select.Content>
        </Select.Root>
    </Card.Header>
    <Card.Content>
        <ChartContainer
            config={chartConfig}
            class="-ml-3 aspect-auto h-62.5 w-full"
        >
            <AreaChart
                legend
                data={filteredData}
                x="date"
                xScale={scaleUtc()}
                series={[
                    {
                        key: "balance",
                        label: "Balance",
                        color: chartConfig.balance.color,
                    },
                    {
                        key: "payment",
                        label: "Payment",
                        color: chartConfig.payment.color,
                    },
                    {
                        key: "subPayment",
                        label: "Sub Payment",
                        color: chartConfig.subPayment.color,
                    },
                ]}
                seriesLayout="stack"
                props={{
                    area: {
                        curve: curveStep,
                        "fill-opacity": 0.4,
                        line: { class: "stroke-1" },
                        motion: "tween",
                    },
                    xAxis: {
                        ticks: timeRange === "7d" ? 7 : undefined,
                        format: (v) => {
                            return v.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            });
                        },
                    },
                    yAxis: { format: () => "" },
                }}
            >
                {#snippet marks({ series, getAreaProps })}
                    <defs>
                        <linearGradient
                            id="fillBalance"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stop-color="var(--color-value)"
                                stop-opacity={1.0}
                            />
                            <stop
                                offset="95%"
                                stop-color="var(--color-value)"
                                stop-opacity={0.1}
                            />
                        </linearGradient>
                        <linearGradient
                            id="fillPayment"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stop-color="var(--color-value)"
                                stop-opacity={1.0}
                            />
                            <stop
                                offset="95%"
                                stop-color="var(--color-value)"
                                stop-opacity={0.1}
                            />
                        </linearGradient>
                        <linearGradient
                            id="fillSubPayment"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stop-color="var(--color-subValue)"
                                stop-opacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stop-color="var(--color-subValue)"
                                stop-opacity={0.1}
                            />
                        </linearGradient>
                    </defs>
                    <ChartClipPath
                        initialWidth={0}
                        motion={{
                            width: {
                                type: "tween",
                                duration: 1000,
                                easing: cubicInOut,
                            },
                        }}
                    >
                        {#each series as s, i (s.key)}
                            <Area
                                {...getAreaProps(s, i)}
                                fill={s.key === "value"
                                    ? "url(#fillValue)"
                                    : "url(#fillSubValue)"}
                            />
                        {/each}
                    </ChartClipPath>
                {/snippet}
                {#snippet tooltip()}
                    <Chart.Tooltip
                        labelFormatter={(v: Date) => {
                            return v.toLocaleDateString("en-US", {
                                month: "long",
                            });
                        }}
                        indicator="line"
                    />
                {/snippet}
            </AreaChart>
        </ChartContainer>
    </Card.Content>
</Card.Root>
