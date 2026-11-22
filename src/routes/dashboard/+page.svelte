<script lang="ts" module>
  function signedCurrency(value?: number | null): string {
    const v = value ?? 0;
    const absFormatted = formatNumber(Math.abs(v));
    if (v > 0) return `+${absFormatted}`;
    if (v < 0) return `-${absFormatted}`;
    return absFormatted;
  }

  function signedPercent(value?: number | null): string {
    const v = value ?? 0;
    // `formatNumber` with style 'percent' expects a decimal fraction (e.g. 0.12 => 12%)
    const formatted = formatNumber(Math.abs(v) / 100, { style: "percent" });
    if (v > 0) return `+${formatted}`;
    if (v < 0) return `-${formatted}`;
    return formatted;
  }

  function signClass(
    value?: number | null,
    positiveClass = "text-success",
    negativeClass = "text-destructive"
  ): string {
    const v = value ?? 0;
    if (v > 0) return positiveClass;
    if (v < 0) return negativeClass;
    // zero -> no color class
    return "";
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { showSuccess, showWarning } from "#lib/components/toast/index.js";
  import { formatNumber } from "#lib/utils/format.js";
  import {
    ChartArea,
    ChartBar,
    toAreaChartData,
    toBarChartData,
  } from "#routes/(components)/charts/index.js";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { useConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import { Loader, Banknote } from "#lib/assets/icons.js";
  import { goto } from "$app/navigation";
  import { BillingInfoForm } from "#routes/history/(components)/index.js";
  import { useLatestBillingStore } from "#lib/stores/latest-billing.svelte.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import type { TimeRangeOption } from "#lib/types/chart.js";

  let { data } = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();
  const latestBillingStore = useLatestBillingStore();

  let openNewBill = $state(false);
  // Shared by both charts: picking a range in either card filters both.
  let timeRange = $state<TimeRangeOption["value"]>("1y");

  onMount(() => {
    if (!data.user) return;
    billingStore.setStatus("loading_data");
    billingStore.fetchData();
    if (page.url.searchParams.get("oauth") === "github" && data.user) {
      showSuccess("Logged in successfully");
      goto(page.url.pathname, { replace: true });
    }
  });
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Overview of your energy billing and savings</p>
    </div>
  </div>

  <!-- Mobile-only compact New Bill card (inline with content, not fixed) -->
  <div class="md:hidden">
    <section class="mb-4">
      <div class="flex items-center justify-between gap-2 rounded-lg border bg-card p-3">
        <div class="flex items-center gap-3">
          <Banknote class="size-5" />
          <div class="text-sm font-medium">Add new bill</div>
        </div>
        <BillingInfoForm
          action="add"
          title="Add new Bill"
          description="Enter billing info"
          callback={(valid, _, metaData) => {
            openNewBill = false;
            if (valid) {
              billingStore.refresh();
              latestBillingStore.refresh();
              consumptionStore.refresh();
              showSuccess("Billing info created successfully!");
            } else {
              showWarning("Failed to create billing info", metaData?.error);
            }
          }}
          billingInfo={latestBillingStore.latestBillingInfo || undefined}
          bind:open={openNewBill}
        >
          {#snippet trigger({ props })}
            <Button {...props} size="sm">
              New
              <span class="sr-only">Open new bill</span>
            </Button>
          {/snippet}
        </BillingInfoForm>
      </div>
    </section>
  </div>

  {@render Metrics()}

  <section>
    <ChartArea
      bind:timeRange
      status={billingStore.status}
      refetch={(cb) => billingStore.refresh().then(cb)}
      chartData={billingStore.extendedBillingInfos.map(toAreaChartData)}
    />
  </section>

  <section>
    <ChartBar
      bind:timeRange
      status={billingStore.status}
      refetch={(cb) => billingStore.refresh().then(cb)}
      chartData={billingStore.extendedBillingInfos.map(toBarChartData)}
    />
  </section>
</div>

{#snippet Metrics()}
  <section
    class="flex flex-col justify-between gap-6 rounded-lg border bg-card p-4 sm:p-6 xl:flex-row xl:items-center"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Banknote class="h-5 w-5" />
        <span class="text-sm font-medium text-muted-foreground">Current</span>
      </div>
      {#if billingStore.status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if billingStore.status === "error"}
        <div class="text-4xl font-semibold tracking-tight sm:text-5xl md:text-4xl lg:text-5xl">
          0
        </div>
      {:else}
        <div class="text-4xl font-semibold tracking-tight sm:text-5xl md:text-4xl lg:text-5xl">
          {formatNumber(billingStore.summary?.current || 0)}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm text-muted-foreground">Total Cost</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl">
            {formatNumber(billingStore.summary?.invested || 0)}
          </span>
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm text-muted-foreground">Total Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(0)}">
            0
          </span>
        {:else}
          <span
            class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(
              billingStore.summary?.totalReturns
            )}"
          >
            {signedCurrency(billingStore.summary?.totalReturns)}
          </span>
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm text-muted-foreground">Net Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(0)}">
            0%
          </span>
        {:else}
          <span
            class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(
              billingStore.summary?.netReturns
            )}"
          >
            {signedPercent(billingStore.summary?.netReturns)}
          </span>
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm text-muted-foreground">Period Change</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(0)}">
              0
            </span>
            <span class="text-xs text-muted-foreground">0%</span>
          </div>
        {:else}
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span
              class="text-xl font-semibold sm:text-2xl md:text-xl lg:text-2xl {signClass(
                billingStore.summary?.periodPaymentChange
              )}"
            >
              {signedCurrency(billingStore.summary?.periodPaymentChange)}
            </span>
            <span class="text-xs text-muted-foreground">
              {signedPercent(billingStore.summary?.periodPaymentChangePct)}
            </span>
          </div>
        {/if}
      </div>
    </div>
  </section>
{/snippet}
