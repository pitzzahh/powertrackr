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
    positiveClass = "text-green-600",
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
  import { showSuccess, showWarning } from "$/components/toast";
  import { formatNumber } from "$/utils/format";
  import { ChartArea, ChartBar, toAreaChartData, toBarChartData } from "$routes/(components)";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { useBillingStore } from "$/stores/billing.svelte.js";
  import { useConsumptionStore } from "$/stores/consumption.svelte";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { Loader, Banknote, PhilippinePeso } from "$lib/assets/icons";
  import { goto } from "$app/navigation";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info.js";
  import { getLatestBillingInfo } from "$/api/billing-info.remote.js";
  import { BillingInfoForm } from "../history/(components)/index.js";

  let { data } = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let openNewBill = $state(false);

  onMount(() => {
    if (!data.user) return;
    billingStore.setUserId(data.user.id);
    billingStore.setStatus("loading_data");
    billingStore.fetchData();
    if (page.url.searchParams.get("oauth") === "github" && data.user) {
      showSuccess("Logged in successfully");
      goto(page.url.pathname, { replaceState: true });
    }
  });
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Overview of your energy billing and savings</p>
    </div>
  </div>

  <!-- Mobile-only compact New Bill card (inline with content, not fixed) -->
  <div class="md:hidden">
    <section class="mb-4">
      <div
        class="flex items-center justify-between gap-2 rounded-md border bg-card p-3 text-muted-foreground shadow-sm"
      >
        <div class="flex items-center gap-3">
          <PhilippinePeso class="size-5" />
          <div class="text-sm font-medium">Add new bill</div>
        </div>
        <Sheet.Root bind:open={openNewBill}>
          <Sheet.Trigger
            class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
          >
            New
            <span class="sr-only">Open new bill</span>
          </Sheet.Trigger>
          <Sheet.Portal>
            <Sheet.Content side="bottom" class="h-[90vh] w-full">
              <Sheet.Header class="border-b">
                <Sheet.Title>Add new Bill</Sheet.Title>
                <Sheet.Description>Enter billing info</Sheet.Description>
              </Sheet.Header>
              <ScrollArea class="min-h-0 flex-1">
                {@const billingInfo = getLatestBillingInfo({ userId: data.user?.id || "" })}
                {#key billingInfo.current}
                  {@const latestBillingInfo =
                    (billingInfo.current?.value[0] as BillingInfoDTOWithSubMeters | undefined) ??
                    undefined}
                  <div class="px-2 pb-2">
                    <BillingInfoForm
                      action="add"
                      callback={(valid, _, metaData) => {
                        openNewBill = false;
                        if (valid) {
                          billingStore.refresh();
                          consumptionStore.refresh();
                          showSuccess("Billing info created successfully!");
                        } else {
                          showWarning("Failed to create billing info", metaData?.error);
                        }
                      }}
                      billingInfo={latestBillingInfo}
                      bind:open={openNewBill}
                    />
                  </div>
                {/key}
              </ScrollArea>
            </Sheet.Content>
          </Sheet.Portal>
        </Sheet.Root>
      </div>
    </section>
  </div>

  {@render Metrics()}

  <section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
    <ChartArea
      status={billingStore.status}
      refetch={(cb) => billingStore.refresh().then(cb)}
      chartData={billingStore.extendedBillingInfos.map(toAreaChartData)}
    />
  </section>

  <section in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
    <ChartBar
      status={billingStore.status}
      refetch={(cb) => billingStore.refresh().then(cb)}
      chartData={billingStore.extendedBillingInfos.map(toBarChartData)}
    />
  </section>
</div>

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
      {#if billingStore.status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if billingStore.status === "error"}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">0</div>
      {:else}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">
          {formatNumber(billingStore.summary?.current || 0)}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-8 md:grid-cols-4 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Cost</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatNumber(billingStore.summary?.invested || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(0)}">0</span>
        {:else}
          <span
            class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(
              billingStore.summary?.totalReturns
            )}"
          >
            {signedCurrency(billingStore.summary?.totalReturns)}
          </span>
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(0)}">0%</span>
        {:else}
          <span
            class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(
              billingStore.summary?.netReturns
            )}"
          >
            {signedPercent(billingStore.summary?.netReturns)}
          </span>
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Period Change</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(0)}">0</span>
            <span class="text-xs text-muted-foreground">0%</span>
          </div>
        {:else}
          <div class="flex items-baseline gap-2">
            <span
              class="text-2xl font-semibold md:text-xl lg:text-2xl {signClass(
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
