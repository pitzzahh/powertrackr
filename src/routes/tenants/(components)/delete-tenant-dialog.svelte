<script lang="ts" module>
  import type { TenantWithMeters } from "#lib/types/tenant.js";

  export type DeleteTenantDialogProps = {
    open?: boolean;
    tenant: TenantWithMeters | null;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { deleteTenant } from "#lib/api/tenant.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { open = $bindable(false), tenant }: DeleteTenantDialogProps = $props();

  let busy = $state(false);

  async function remove() {
    if (busy || !tenant) return;
    busy = true;
    const id = tenant.id;
    if (
      await notifyResult({
        run: () => deleteTenant({ tenantUserId: id }),
        issues: () => [],
        success: "Tenant deleted",
        failure: "Failed to delete tenant",
      })
    ) {
      open = false;
    }
    busy = false;
  }
</script>

<DynamicModal
  bind:open
  title="Delete Tenant"
  description={tenant
    ? `This permanently deletes ${tenant.name} and all of their readings and submissions. Past bills lose their sub-meter rows and payments, so their totals will no longer add up. This cannot be undone.`
    : ""}
  size="sm"
>
  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onclick={() => (open = false)} disabled={busy}>
        Cancel
      </Button>
      <Button type="button" variant="destructive" disabled={busy || !tenant} onclick={remove}>
        {#if busy}
          <Loader class="size-4 animate-spin" />
          Deleting…
        {:else}
          Delete Tenant
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>
