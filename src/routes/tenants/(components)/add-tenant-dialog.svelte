<script lang="ts" module>
  export type AddTenantDialogProps = { open?: boolean };
</script>

<script lang="ts">
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { createTenant } from "#lib/api/tenant.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { open = $bindable(false) }: AddTenantDialogProps = $props();

  let busy = $state(false);
  const fields = createTenant.fields;
</script>

<DynamicModal
  bind:open
  title="Add Tenant"
  description="The tenant will use these credentials to log in and submit meter readings."
  size="sm"
>
  <form
    id="add-tenant-form"
    {...createTenant.enhance(async ({ submit }) => {
      if (busy) return;
      busy = true;
      if (
        await notifyResult({
          run: submit,
          issues: () => fields.allIssues(),
          success: "Tenant created",
          failure: "Failed to create tenant",
        })
      ) {
        open = false;
      }
      busy = false;
    })}
    class="space-y-4"
  >
    <Field.Field>
      <Field.Label for="tenant-name" class="px-1">Name</Field.Label>
      <Input
        id="tenant-name"
        placeholder="Tenant name"
        required
        aria-describedby="tenant-name-error"
        {...fields.name.as("text")}
      />
      <Field.Error id="tenant-name-error" errors={fields.name.issues()} />
    </Field.Field>
    <Field.Field>
      <Field.Label for="tenant-email" class="px-1">Email</Field.Label>
      <Input
        id="tenant-email"
        placeholder="tenant@example.com"
        required
        aria-describedby="tenant-email-error"
        {...fieldInputProps(fields.email.as("email"))}
      />
      <Field.Error id="tenant-email-error" errors={fields.email.issues()} />
    </Field.Field>
    <Field.Field>
      <Field.Label for="tenant-password" class="px-1">Password</Field.Label>
      <Input
        id="tenant-password"
        placeholder="At least 8 characters"
        required
        autocomplete="new-password"
        aria-describedby="tenant-password-error"
        {...fieldInputProps(fields.password.as("password"))}
      />
      <Field.Error id="tenant-password-error" errors={fields.password.issues()} />
    </Field.Field>
  </form>
  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" form="add-tenant-form" disabled={busy}>
        {#if busy}
          <Loader class="size-4 animate-spin" />
          Creating…
        {:else}
          Create Tenant
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>
