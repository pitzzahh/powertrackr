<script lang="ts">
  import { extendedBillingInfoToTableView } from "#lib/utils/mapper/billing-info.js";
  import { HistoryDataTable } from "#routes/history/(components)/index.js";
  import { onMount } from "svelte";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { formatNumber, formatEnergy } from "#lib/utils/format.js";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { Banknote } from "#lib/assets/icons.js";
  import PageHeader from "#routes/(components)/page-header.svelte";
  import MetricsCard from "#routes/(components)/metrics-card.svelte";

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
      paidBills: billingStore.extendedBillingInfos.filter((info) => info.status === "paid").length,
      pendingBills: billingStore.extendedBillingInfos.filter((info) => info.status === "pending")
        .length,
    });

  onMount(() => {
    if (!data.user) return;
    billingStore.setStatus("loading_data");
    billingStore.fetchData();
  });
</script>

<div class="space-y-6 pb-4">
  <PageHeader eyebrow="Ledger" title="History" description="View your billing history" />

  {@render Metrics()}

  <HistoryDataTable
    status={billingStore.status}
    data={billingStore.extendedBillingInfos.map(extendedBillingInfoToTableView)}
  />
</div>

{#snippet Metrics()}
  <div in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}>
    <MetricsCard
      icon={Banknote}
      label="Total Billing Periods"
      hero={billingStore.status === "error" ? "0" : totalBillingPeriods}
      loading={billingStore.status === "fetching"}
      stats={[
        {
          label: "Total Energy",
          value: formatEnergy(totalEnergyConsumed),
        },
        {
          label: "Total Payments",
          value: formatNumber(totalPaymentsMade),
        },
        {
          label: "Average Balance",
          value: formatNumber(averageBalance),
        },
        {
          label: "Paid Bills",
          value: paidBills,
        },
        {
          label: "Pending Bills",
          value: pendingBills,
        },
      ]}
    />
  </div>
{/snippet}
