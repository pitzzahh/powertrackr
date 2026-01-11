<script lang="ts" module>
  type PageState = {
    status: Status;
  };
</script>

<script lang="ts">
  import type { Status } from "$/types/state";
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { onMount } from "svelte";
  import { billingStore } from "$lib/stores/billing.svelte.js";

  let { status }: PageState = $state({
    status: "idle",
  });

  onMount(() => billingStore.fetchData());
</script>

<HistoryDataTable
  {status}
  data={billingStore.extendedBillingInfos.map(extendedBillingInfoToTableView)}
/>
