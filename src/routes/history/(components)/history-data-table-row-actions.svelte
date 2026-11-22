<script module lang="ts">
  import type { SvelteRow as Row } from "#lib/components/ui/data-table/index.js";
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";

  export interface BillingInfoDataTableRowActionsProps {
    row: Row<ExtendedBillingInfoTableView>;
  }
</script>

<script lang="ts">
  import { Loader, Trash2, View, Pencil, Check } from "#lib/assets/icons.js";
  import { BillingInfoForm } from ".";
  import Button from "#lib/components/ui/button/button.svelte";
  import { showSuccess, showWarning } from "#lib/components/toast/index.js";
  import { finalizeBilling } from "#lib/api/billing-info.remote.js";
  import { isHttpError } from "@sveltejs/kit";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { useConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import {
    billingInfoToDto,
    extendedBillingInfoToTableView,
  } from "#lib/utils/mapper/billing-info.js";
  import { findPreviousBillingInfo } from "#lib/utils/previous-reading.js";
  import BillingDetailsDialog from "./billing-details-dialog.svelte";
  import RemoveBillingDialog from "./remove-billing-dialog.svelte";

  let { row }: BillingInfoDataTableRowActionsProps = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let openView = $state(false);
  let openEdit = $state(false);
  let openRemove = $state(false);
  let finalizing = $state(false);

  // The billing record immediately before the row's record (by date), used by the
  // edit form to display the true previous reading for each sub meter.
  const previousBillingInfo = $derived.by(() => {
    const previous = findPreviousBillingInfo(billingStore.extendedBillingInfos, row.original.date);
    return previous ? billingInfoToDto(extendedBillingInfoToTableView(previous)) : undefined;
  });

  async function finalize() {
    if (finalizing) return;
    finalizing = true;
    try {
      await finalizeBilling({ billingInfoId: row.original.id });
      refresh();
      showSuccess("Billing finalized");
    } catch (e) {
      showWarning((isHttpError(e) && e.body.message) || "Failed to finalize billing");
    } finally {
      finalizing = false;
    }
  }

  function refresh() {
    billingStore.refresh();
    consumptionStore.refresh();
  }
</script>

<div class="flex items-center justify-center gap-2">
  <Button
    size="icon"
    variant="outline"
    title="View Billing Info Details"
    aria-label="View billing details"
    onclick={() => (openView = true)}
  >
    <View />
  </Button>
  {#if row.original.paymentId == null}
    <Button
      size="icon"
      variant="outline"
      title="Finalize pending billing (materialize tenant readings and payments)"
      aria-label="Finalize pending billing"
      disabled={finalizing}
      onclick={finalize}
    >
      {#if finalizing}
        <Loader class="size-4 animate-spin" />
      {:else}
        <Check />
      {/if}
    </Button>
  {/if}
  <Button
    size="icon"
    variant="outline"
    title="Edit Billing Info Details"
    aria-label="Edit billing"
    onclick={() => (openEdit = true)}
  >
    <Pencil />
  </Button>
  <Button
    size="icon"
    variant="destructive"
    title="Remove Billing Info Record"
    aria-label="Remove billing"
    onclick={() => (openRemove = true)}
  >
    <Trash2 />
  </Button>
</div>

<BillingDetailsDialog bind:open={openView} billing={row.original} />
<RemoveBillingDialog bind:open={openRemove} billing={row.original} onremoved={refresh} />

<BillingInfoForm
  action="update"
  title="Edit billing info of {row.original.dateFormatted}"
  description="Update the billing info details for billing info with id #{row.original.id}"
  callback={(valid, _, metaData) => {
    openEdit = false;
    if (valid) {
      refresh();
      showSuccess("Billing info updated successfully!");
    } else {
      showWarning("Failed to update billing info", metaData?.error);
    }
  }}
  billingInfo={billingInfoToDto(row.original)}
  {previousBillingInfo}
  bind:open={openEdit}
/>
