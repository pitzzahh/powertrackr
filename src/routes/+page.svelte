<script lang="ts" module>
  import type { BillingSummary, ExtendedBillingInfo } from "$/types/billing-info";

  type PageState = {
    extendedBillingInfos: ExtendedBillingInfo[];
    status: Status;
    summary: BillingSummary | null;
  };

  function computeSummary(infos: ExtendedBillingInfo[]): BillingSummary {
    if (infos.length === 0) {
      return {
        current: 0,
        invested: 0,
        totalReturns: 0,
        netReturns: 0,
        oneDayReturns: 0,
        averageDailyReturn: 0,
        averageMonthlyReturn: 0,
      };
    }
    const latest = infos[0];
    const current = latest?.balance ?? 0;
    const invested = infos.reduce(
      (sum, info) =>
        sum +
        ((info.payment?.amount ?? 0) +
          info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0)),
      0
    );
    const totalReturns = infos.reduce(
      (sum, info) =>
        sum + info.subMeters.reduce((subSum, sub) => subSum + (sub.payment?.amount ?? 0), 0),
      0
    );
    const netReturns = invested > 0 ? (totalReturns / invested) * 100 : 0;
    const oneDayReturns = latest.subMeters.reduce(
      (sum, sub) => sum + (sub.payment?.amount ?? 0),
      0
    );
    const firstDate = new Date(infos[infos.length - 1].date);
    const lastDate = new Date(latest.date);
    const totalDays = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDailyReturn = totalReturns / totalDays;
    const totalMonths = totalDays / 30;
    const averageMonthlyReturn = totalReturns / totalMonths;
    return {
      current,
      invested,
      totalReturns,
      netReturns,
      oneDayReturns,
      averageDailyReturn,
      averageMonthlyReturn,
    };
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { showSuccess } from "$/components/toast";
  import { formatNumber } from "$/utils/format";
  import { ChartArea, ChartBar, toAreaChartData, toBarChartData } from "$routes/(components)";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { getExtendedBillingInfos } from "$/api/billing-info.remote";
  import { hydratable } from "svelte";
  import { Loader, Banknote } from "$lib/assets/icons";
  import type { Status } from "$/types/state.js";

  let { data } = $props();

  let { extendedBillingInfos, status, summary }: PageState = $state({
    extendedBillingInfos: [],
    status: "fetching",
    summary: null,
  });

  async function fetchData() {
    try {
      status = "fetching";
      extendedBillingInfos = await hydratable("chart_data", () =>
        getExtendedBillingInfos({
          userId: data?.user?.id || "",
        })
      );
      summary = computeSummary(extendedBillingInfos);
      status = "success";
    } catch (error) {
      console.error(error);
      status = "error";
      extendedBillingInfos = [];
      summary = null;
    }
  }
  onMount(() => {
    fetchData();
    if (page.url.searchParams.get("oauth") === "github" && data.user) {
      showSuccess("Logged in successfully");
      goto("/", { replaceState: true });
    }
  });
</script>

{@render Metrics()}

<section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
  <ChartArea
    {status}
    refetch={() => fetchData()}
    chartData={extendedBillingInfos.map(toAreaChartData)}
  />
</section>

<section in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
  <ChartBar
    {status}
    refetch={() => fetchData()}
    chartData={extendedBillingInfos.map(toBarChartData)}
  />
</section>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col justify-between gap-8 rounded-md border bg-card p-6 text-muted-foreground shadow-sm xl:flex-row xl:items-center"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Banknote class="h-5 w-5" />
        <span class="text-lg">Current</span>
      </div>
      {#if status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if status === "error"}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">0</div>
      {:else}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">
          {formatNumber(summary?.current || 0)}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-8 md:grid-cols-4 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Cost</span>
        {#if status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatNumber(summary?.invested || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Savings</span>
        {#if status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(summary?.totalReturns || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Savings</span>
        {#if status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0%</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(summary?.netReturns || 0)}%</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">1 Day Savings</span>
        {#if status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(summary?.oneDayReturns || 0)}</span
          >
        {/if}
      </div>
    </div>
  </section>
{/snippet}
