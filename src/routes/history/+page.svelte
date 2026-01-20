<script lang="ts">
  import type { Status } from "$/types/state";
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { onMount } from "svelte";
  import { BILLING_STORE } from "$lib/stores/billing.svelte.js";

  let { data } = $props();

  onMount(() => {
    if (!data.user) return;
    BILLING_STORE.setUserId(data.user.id);
    BILLING_STORE.fetchData();
  });
</script>

<HistoryDataTable
  status={BILLING_STORE.status}
  data={BILLING_STORE.extendedBillingInfos.map(extendedBillingInfoToTableView)}
/>
