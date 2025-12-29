<script lang="ts">
    import { getBillingInfos } from "$/remotes/billing-info.remote";
    import type { BillingInfo } from "$/types/billing-info";
    import { HistoryDataTable } from "$routes/history/(components)";
    import { onMount } from "svelte";

    let { billingInfos }: { billingInfos: BillingInfo[] } = $state({
        billingInfos: [],
    });

    onMount(async () => {
        billingInfos = await getBillingInfos({
            userId: "5wqtwauhbzkfcqo",
        });
    });
</script>

<HistoryDataTable data={billingInfos} />
