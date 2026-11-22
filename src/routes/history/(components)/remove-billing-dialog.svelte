<script lang="ts" module>
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";

  export type RemoveBillingDialogProps = {
    open?: boolean;
    billing: ExtendedBillingInfoTableView;
    onremoved: () => void;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { LoadingDots, WarningBanner } from "#lib/components/snippets.svelte";
  import { showInspectorWarning, showSuccess, showWarning } from "#lib/components/toast/index.js";
  import { deleteBillingInfo } from "#lib/api/billing-info.remote.js";
  import { formatDate } from "#lib/utils/format.js";

  let { open = $bindable(false), billing, onremoved }: RemoveBillingDialogProps = $props();

  let confirmValue = $state("");
  let busy = $state(false);

  const date = $derived(formatDate(billing.date));

  async function remove() {
    if (confirmValue !== date) return showInspectorWarning();
    busy = true;
    let result;
    try {
      result = await deleteBillingInfo({ id: billing.id, count: 1 });
    } catch (err) {
      return showWarning(
        "Failed to remove billing info.",
        (err as { body?: { message?: string } }).body?.message ?? (err as Error).message
      );
    } finally {
      busy = false;
    }
    const { valid, value, message } = result;
    open = false;
    confirmValue = "";
    if (!valid || value != 1) {
      return showWarning(
        "Failed to remove billing info. It may not exist or already removed.",
        `More info: ${message || "unknown reason"}`
      );
    }
    onremoved();
    showSuccess("Billing info deleted successfully", message);
  }
</script>

<DynamicModal
  bind:open
  onOpenChange={(next) => {
    if (!next && busy) {
      showWarning("Process Interrupted", "The operation is still processing. Please wait...");
      open = true;
    }
  }}
  title="Remove Billing Info Record"
  description="Are you sure you want to remove this billing info record? This action cannot be undone."
  size="sm"
>
  <div class="flex flex-col gap-3">
    {@render WarningBanner({
      message: "Removing this will also remove the sub meter billing informations.",
    })}
    <label class="text-sm text-muted-foreground" for="remove-{billing.id}">
      Type <span class="font-mono text-foreground">{date}</span> to confirm
    </label>
    <Input
      id="remove-{billing.id}"
      bind:value={confirmValue}
      type="text"
      placeholder={date}
      autocomplete="off"
      class="text-center"
    />
  </div>
  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        variant="secondary"
        disabled={busy}
        onclick={() => {
          open = false;
          confirmValue = "";
        }}
      >
        Cancel
      </Button>
      <Button variant="destructive" onclick={remove} disabled={confirmValue !== date || busy}>
        {#if busy}
          <Loader class="size-4 animate-spin" />
          Removing
          {@render LoadingDots()}
        {:else}
          Delete {date}
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>
