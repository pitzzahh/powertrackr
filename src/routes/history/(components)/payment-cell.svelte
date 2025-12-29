<script lang="ts">
    import { Badge } from "$/components/ui/badge";
    import { getPayment } from "$/remotes/payment.remote";
    import { formatNumber } from "$/utils/format";
    import { Loader } from "$lib/assets/icons";

    let { paymentId }: { paymentId: string | null } = $props();

    const payment = $derived(paymentId ? getPayment(paymentId) : null);
</script>

{#if paymentId && payment}
    {#if payment.loading}
        <Badge variant="secondary">
            <Loader class="h-4 w-4 animate-spin" />
        </Badge>
    {:else if payment.error}
        <Badge variant="secondary" title="0">0</Badge>
    {:else}
        <Badge
            variant="secondary"
            title={formatNumber(payment.current?.amount || 0)}
        >
            {formatNumber(payment.current?.amount || 0)}
        </Badge>
    {/if}
{:else}
    <Badge variant="secondary" title="0">0</Badge>
{/if}
