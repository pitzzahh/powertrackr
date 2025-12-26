<script lang="ts">
  import { Badge } from "$/components/ui/badge";
  import { getPayment } from "$/remotes/payment.remote";
  import { formatNumber } from "$/utils/format";

  let { paymentId }: { paymentId: string | null } = $props();
</script>

<svelte:boundary>
  {@const payment = await getPayment(paymentId!)}
  <Badge title={formatNumber(payment?.amount || 0)}>
    {formatNumber(payment?.amount || 0)}
  </Badge>

  {#snippet pending()}
    <Badge>Loading...</Badge>
  {/snippet}

  {#snippet failed()}
    <Badge title="0">0</Badge>
  {/snippet}
</svelte:boundary>
