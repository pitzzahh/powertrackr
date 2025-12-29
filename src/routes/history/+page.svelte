<script lang="ts" module>
    type PageState = {
        billingInfos: BillingInfo[];
        status: Status;
    };
</script>

<script lang="ts">
    import { getBillingInfos } from "$/remotes/billing-info.remote";
    import type { BillingInfo } from "$/types/billing-info";
    import type { Status } from "$/types/state";
    import { HistoryDataTable } from "$routes/history/(components)";
    import { hydratable, onMount } from "svelte";

    let { billingInfos, status }: PageState = $state({
        billingInfos: [],
        status: "idle",
    });

    onMount(async () => {
        status = "loading_data";
        billingInfos = await hydratable("history_data", () =>
            getBillingInfos({
                userId: "5wqtwauhbzkfcqo",
            }),
        );
        status = "success";
    });
</script>

<HistoryDataTable {status} data={billingInfos} />
