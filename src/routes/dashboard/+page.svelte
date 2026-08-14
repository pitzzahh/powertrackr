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

  function signTone(value?: number | null): "default" | "success" | "destructive" {
    const v = value ?? 0;
    if (v > 0) return "success";
    if (v < 0) return "destructive";
    return "default";
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
  } from "#routes/(components)/index.js";
  import PageHeader from "#routes/(components)/page-header.svelte";
  import MetricsCard from "#routes/(components)/metrics-card.svelte";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { useConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import { ScrollArea } from "#lib/components/ui/scroll-area/index.js";
  import { Banknote, PhilippinePeso } from "#lib/assets/icons.js";
  import { goto } from "$app/navigation";
  import { BillingInfoForm } from "../history/(components)/index.js";
  import { useLatestBillingStore } from "#lib/stores/latest-billing.svelte.js";

  let { data } = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();
  const latestBillingStore = useLatestBillingStore();

  let openNewBill = $state(false);

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
  <PageHeader
    eyebrow="Overview"
    title="Dashboard"
    description="Your energy billing and savings at a glance"
  />

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
                {@const latestBillingInfo = latestBillingStore.latestBillingInfo}
                <div class="px-2 pb-2">
                  <BillingInfoForm
                    action="add"
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
                    billingInfo={latestBillingInfo || undefined}
                    bind:open={openNewBill}
                  />
                </div>
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
  <div in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}>
    <MetricsCard
      icon={Banknote}
      label="Current"
      hero={billingStore.status === "error"
        ? "0"
        : formatNumber(billingStore.summary?.current || 0)}
      loading={billingStore.status === "fetching"}
      stats={[
        {
          label: "Total Cost",
          value: formatNumber(billingStore.summary?.invested || 0),
        },
        {
          label: "Total Savings",
          value: signedCurrency(billingStore.summary?.totalReturns),
          tone: signTone(billingStore.summary?.totalReturns),
        },
        {
          label: "Net Savings",
          value: signedPercent(billingStore.summary?.netReturns),
          tone: signTone(billingStore.summary?.netReturns),
        },
        {
          label: "Period Change",
          value: signedCurrency(billingStore.summary?.periodPaymentChange),
          tone: signTone(billingStore.summary?.periodPaymentChange),
          note: signedPercent(billingStore.summary?.periodPaymentChangePct),
        },
      ]}
    />
  </div>
{/snippet}
