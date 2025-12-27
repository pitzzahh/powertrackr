<script lang="ts">
  import { Badge } from "$/components/ui/badge";
  import { getPayment } from "$/remotes/payment.remote";
  import { formatNumber } from "$/utils/format";

  let { paymentId }: { paymentId: string | null } = $props();
</script>

<svelte:boundary>
  {#if paymentId}
    {@const payment = await getPayment(paymentId)}
    {@render badge(payment?.amount || 0)}
  {:else}
    {@render badge(0)}
  {/if}

  {#snippet pending()}
    <Badge variant="secondary">Loading...</Badge>
  {/snippet}

  {#snippet failed()}
    <Badge variant="secondary" title="0">0</Badge>
  {/snippet}
</svelte:boundary>

{#snippet badge(amount: number)}
  <Badge variant="secondary" title={formatNumber(amount)}>
    {formatNumber(amount)}
  </Badge>
{/snippet}
