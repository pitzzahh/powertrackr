<script lang="ts" module>
  type PageState = {
    billingInfos: BillingInfo[];
    status: Status;
  };
</script>

<script lang="ts">
  import { getBillingInfos } from "$/api/billing-info.remote";
  import type { BillingInfo } from "$/types/billing-info";
  import type { Status } from "$/types/state";
  import { billingInfoToTableView } from "$/utils/mapper/billing-info";
  import { HistoryDataTable } from "$routes/history/(components)";
  import { hydratable, onMount } from "svelte";

  let { data } = $props();

  const { user } = $derived(data);

  let { billingInfos, status }: PageState = $state({
    billingInfos: [],
    status: "idle",
  });

  onMount(async () => {
    status = "loading_data";
    try {
      billingInfos = await hydratable("billing_infos", () =>
        getBillingInfos({ userId: user?.id ?? "" }),
      );
    } catch (error) {
      console.error(error);
      billingInfos = [];
      status = "error";
      return;
    }
    status = "success";
  });
</script>

<HistoryDataTable {status} data={billingInfos.map(billingInfoToTableView)} />
