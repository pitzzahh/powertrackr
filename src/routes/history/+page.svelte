<script lang="ts">
  import type { Status } from "$/types/state";
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { onMount } from "svelte";
  import { useBillingStore } from "$/stores/billing.svelte.js";

  let { data } = $props();

  const billingStore = useBillingStore();

  onMount(() => {
    if (!data.user) return;
    billingStore.setUserId(data.user.id);
    billingStore.fetchData();
  });
</script>

<HistoryDataTable
  status={billingStore.status}
  data={billingStore.extendedBillingInfos.map(extendedBillingInfoToTableView)}
/>
