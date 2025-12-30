<script lang="ts">
  import { formatNumber } from "$/utils/format";
  import {
    ChartArea,
    ChartBar,
    toAreaChartData,
    toBarChartData,
  } from "$routes/(components)";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import {
    getExtendedBillingInfos,
    getBillingSummary,
  } from "$lib/remotes/billing-info.remote";
  import { hydratable, onMount } from "svelte";
  import { Loader, Banknote } from "$lib/assets/icons";
  import type { ExtendedBillingInfo } from "$/types/billing-info";

  let {
    extendedBillingInfos,
    status,
  }: {
    extendedBillingInfos: ExtendedBillingInfo[];
    status: "fetching" | "fetched" | "error";
  } = $state({
    extendedBillingInfos: [],
    status: "fetching",
  });

  const summary = $derived(getBillingSummary({ userId: "5wqtwauhbzkfcqo" }));

  onMount(async () => {
    status = "fetching";
    try {
      extendedBillingInfos = await hydratable("chart_data", () =>
        getExtendedBillingInfos({
          userId: "5wqtwauhbzkfcqo",
        }),
      );
      status = "fetched";
    } catch (error) {
      console.error(error);
      status = "error";
    }
  });
</script>

{@render Metrics()}

<section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
  <ChartArea chartData={extendedBillingInfos.map(toAreaChartData)} {status} />
</section>

<section in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
  <ChartBar chartData={extendedBillingInfos.map(toBarChartData)} {status} />
</section>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col xl:flex-row gap-8 xl:items-center justify-between p-6 bg-card border shadow-sm text-muted-foreground rounded-md"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Banknote class="h-5 w-5" />
        <span class="text-lg">Current</span>
      </div>
      {#if summary?.loading}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if summary?.error}
        <div class="text-5xl md:text-4xl lg:text-5xl font-bold">0</div>
      {:else}
        <div class="text-5xl md:text-4xl lg:text-5xl font-bold">
          {formatNumber(summary.current?.current || 0)}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Cost</span>
        {#if summary?.loading}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if summary?.error}
          <span class="text-2xl md:text-xl lg:text-2xl font-semibold">0</span>
        {:else}
          <span class="text-2xl md:text-xl lg:text-2xl font-semibold"
            >{formatNumber(summary.current?.invested || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Savings</span>
        {#if summary?.loading}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if summary?.error}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+0</span
          >
        {:else}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+{formatNumber(summary.current?.totalReturns || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Savings</span>
        {#if summary?.loading}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if summary?.error}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+0%</span
          >
        {:else}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+{formatNumber(summary.current?.netReturns || 0)}%</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">1 Day Savings</span>
        {#if summary?.loading}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if summary?.error}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+0</span
          >
        {:else}
          <span
            class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
            >+{formatNumber(summary.current?.oneDayReturns || 0)}</span
          >
        {/if}
      </div>
    </div>
  </section>
{/snippet}
