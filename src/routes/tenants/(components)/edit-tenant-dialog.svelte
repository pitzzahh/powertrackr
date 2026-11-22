<script lang="ts" module>
  import type { TenantWithMeters } from "#lib/types/tenant.js";

  export type EditTenantDialogProps = {
    open?: boolean;
    tenant: TenantWithMeters | null;
  };
</script>

<script lang="ts">
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { updateTenant } from "#lib/api/tenant.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { open = $bindable(false), tenant }: EditTenantDialogProps = $props();

  let busy = $state(false);
  const fields = updateTenant.fields;
</script>

<DynamicModal
  bind:open
  title="Edit Tenant"
  description={tenant ? `Rename ${tenant.name}. Their email and credentials stay the same.` : ""}
  size="sm"
>
  {#if tenant}
    <!-- Keyed so each tenant opens with its own name prefilled -->
    {#key tenant.id}
      <form
        id="edit-tenant-form"
        {...updateTenant.enhance(async ({ submit }) => {
          if (busy) return;
          busy = true;
          if (
            await notifyResult({
              run: submit,
              issues: () => fields.allIssues(),
              success: "Tenant updated",
              failure: "Failed to update tenant",
            })
          ) {
            open = false;
          }
          busy = false;
        })}
        class="space-y-4"
      >
        <input type="hidden" {...fields.tenantUserId.as("text")} value={tenant.id} />
        <Field.Field>
          <Field.Label for="edit-tenant-name" class="px-1">Name</Field.Label>
          <Input
            id="edit-tenant-name"
            required
            minlength={2}
            aria-describedby="edit-tenant-name-error"
            {...fields.name.as("text")}
            value={tenant.name}
          />
          <Field.Error id="edit-tenant-name-error" errors={fields.name.issues()} />
        </Field.Field>
      </form>
    {/key}
  {/if}
  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" form="edit-tenant-form" disabled={busy || !tenant}>
        {#if busy}
          <Loader class="size-4 animate-spin" />
          Saving…
        {:else}
          Save
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>
