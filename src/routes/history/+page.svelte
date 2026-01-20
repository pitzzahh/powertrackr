<script lang="ts">
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { onMount } from "svelte";
  import { useBillingStore } from "$/stores/billing.svelte.js";

  let { data } = $props();

  const billingStore = useBillingStore();

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

  <HistoryDataTable
    status={billingStore.status}
    data={billingStore.extendedBillingInfos.map(extendedBillingInfoToTableView)}
  />
</div>
