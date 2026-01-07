<script lang="ts" module>
  type PageState = {
    billingInfos: ExtendedBillingInfo[];
    status: Status;
  };
</script>

<script lang="ts">
  import { getExtendedBillingInfos } from "$/api/billing-info.remote";
  import type { ExtendedBillingInfo } from "$/types/billing-info";
  import type { Status } from "$/types/state";
  import { extendedBillingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { hydratable, onMount } from "svelte";

  let { data } = $props();

  const { user } = $derived(data);

  let { billingInfos, status }: PageState = $state({
    billingInfos: [],
    status: "idle",
  });

  async function fetchData() {
    status = "loading_data";
    try {
      billingInfos = await hydratable("billing_infos", () =>
        getExtendedBillingInfos({ userId: user?.id ?? "" }),
      );
    } catch (error) {
      console.error(error);
      billingInfos = [];
      status = "error";
      return;
    }
    status = "success";
  }

  onMount(() => fetchData());
</script>

<HistoryDataTable {status} data={billingInfos.map(extendedBillingInfoToTableView)} />
