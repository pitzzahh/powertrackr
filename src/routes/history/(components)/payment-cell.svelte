<script lang="ts">
  import { untrack, onDestroy } from "svelte";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { getPayment } from "#lib/api/payment.remote.js";
  import { formatNumber } from "#lib/utils/format.js";
  import { Loader } from "#lib/assets/icons.js";
  import { watch } from "runed";
  import { Button } from "#lib/components/ui/button/index.js";
  import { usePendingFetch } from "#lib/hooks/use-pending-fetch.svelte.js";

  let { paymentId }: { paymentId: string | null } = $props();

  let payment = $derived(paymentId ? getPayment(paymentId) : null);

  const pendingFetch = usePendingFetch();

  let wasLoading = false;

  watch(
    () => payment?.loading,
    (loading) =>
      untrack(() => {
        if (loading && !wasLoading) {
          pendingFetch.add();
          wasLoading = true;
        } else if (!loading && wasLoading) {
          pendingFetch.delete();
          wasLoading = false;
        }
      })
  );

  onDestroy(() => {
    if (wasLoading) {
      pendingFetch.delete();
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
    {@const value = payment.current?.value[0]}
    <Badge variant="secondary" title={formatNumber(value?.amount || 0)}>
      {formatNumber(value?.amount || 0)}
    </Badge>
  {/if}
{:else}
  <Badge variant="secondary" title="0">0</Badge>
{/if}
