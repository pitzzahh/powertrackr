<script lang="ts">
  import { untrack, onDestroy } from "svelte";
  import { Badge } from "$/components/ui/badge";
  import { getPayment } from "$/api/payment.remote";
  import { formatNumber } from "$/utils/format";
  import { Loader } from "$lib/assets/icons";
  import { pendingFetchContext } from "$lib/context";
  import { watch } from "runed";
  import { Button } from "$/components/ui/button";

  let { paymentId }: { paymentId: string | null } = $props();

  let payment = $derived(paymentId ? getPayment(paymentId) : null);

  const ctx = pendingFetchContext.get();

  let wasLoading = false;

  watch(
    () => payment?.loading,
    (loading) =>
      untrack(() => {
        if (loading && !wasLoading) {
          ctx.add();
          wasLoading = true;
        } else if (!loading && wasLoading) {
          ctx.delete();
          wasLoading = false;
        }
      }),
  );

  onDestroy(() => {
    if (wasLoading) {
      ctx.delete();
    }
  });
</script>

{#if paymentId && payment}
  {#if payment.loading}
    <Badge variant="secondary">
      <Loader class="size-4 animate-spin" />
    </Badge>
  {:else if payment.error}
    <Button
      variant="ghost"
      title="Retry fetching payment"
      onclick={() => (payment = getPayment(paymentId))}>Retry</Button
    >
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
