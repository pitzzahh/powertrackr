<script lang="ts">
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { onMount } from "svelte";
  import { useBillingStore } from "$/stores/billing.svelte.js";
  import { formatNumber, formatEnergy } from "$/utils/format";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { Loader, Banknote } from "$lib/assets/icons";

  let { data } = $props();

  const billingStore = useBillingStore();

  const { totalBillingPeriods } = $derived({
    totalBillingPeriods: billingStore.extendedBillingInfos.length,
  });

  const { totalEnergyConsumed, totalPaymentsMade, averageBalance, paidBills, pendingBills } =
    $derived({
      totalEnergyConsumed: billingStore.extendedBillingInfos.reduce(
        (sum, info) => sum + info.totalkWh,
        0
      ),
      totalPaymentsMade: billingStore.extendedBillingInfos.reduce(
        (sum, info) => sum + (info.payment?.amount || 0),
        0
      ),
      averageBalance:
        totalBillingPeriods > 0
          ? billingStore.extendedBillingInfos.reduce((sum, info) => sum + info.balance, 0) /
            totalBillingPeriods
          : 0,
      paidBills: billingStore.extendedBillingInfos.filter((info) => info.status === "Paid").length,
      pendingBills: billingStore.extendedBillingInfos.filter((info) => info.status === "Pending")
        .length,
    });

  onMount(() => {
    if (!data.user) return;
    billingStore.setUserId(data.user.id);
    billingStore.setStatus("loading_data");
    billingStore.fetchData();
  });
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">History</h1>
      <p class="text-muted-foreground">View your billing history</p>
    </div>
  </div>

  {@render Metrics()}

  <HistoryDataTable
    status={billingStore.status}
    data={billingStore.extendedBillingInfos.map(extendedBillingInfoToTableView)}
  />
</div>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col justify-between gap-8 rounded-md border bg-card p-6 text-muted-foreground shadow-sm xl:flex-row xl:items-center"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Banknote class="h-5 w-5" />
        <span class="text-lg">Total Billing Periods</span>
      </div>
      {#if billingStore.status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if billingStore.status === "error"}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">0</div>
      {:else}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">
          {totalBillingPeriods}
        </div>
      {/if}
    </div>

    <!-- expanded grid to include Average Balance -->
    <div class="grid grid-cols-2 gap-8 md:grid-cols-5 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Energy</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">{formatEnergy(0)}</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatEnergy(totalEnergyConsumed)}</span
          >
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Payments</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatNumber(totalPaymentsMade)}</span
          >
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-sm">Average Balance</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">{formatNumber(0)}</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">
            {formatNumber(averageBalance)}
          </span>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-sm">Paid Bills</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">{paidBills}</span>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-sm">Pending Bills</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">{pendingBills}</span>
        {/if}
      </div>
    </div>
  </section>
{/snippet}
