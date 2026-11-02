<script lang="ts">
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { Loader, CirclePlus, Pencil, Trash2 } from "#lib/assets/icons.js";
  import { getTenants, createTenant, updateTenant, deleteTenant } from "#lib/api/tenant.remote.js";
  import type { TenantWithMeters } from "#lib/types/tenant.js";
  import { formatDate } from "#lib/utils/format.js";
  import { showSuccess, showWarning } from "#lib/components/toast/index.js";
  import { isHttpError } from "@sveltejs/kit";

  // The query drives the page reactively. Mutations refresh it server-side
  // (single-flight), so `current` updates without any client-side re-fetch.
  const tenantsQuery = getTenants({});

  let openAddTenant = $state(false);
  let creating = $state(false);

  let editTarget = $state<TenantWithMeters | null>(null);
  let openEdit = $state(false);
  let editName = $state("");

  let deleteTarget = $state<TenantWithMeters | null>(null);
  let openDelete = $state(false);
  let deleting = $state(false);

  function openEditDialog(tenant: TenantWithMeters) {
    editTarget = tenant;
    editName = tenant.name;
    openEdit = true;
  }

  function openDeleteDialog(tenant: TenantWithMeters) {
    deleteTarget = tenant;
    openDelete = true;
  }
</script>

<div class="space-y-6 pb-4">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Tenants</h1>
      <p class="text-muted-foreground">
        Create tenant accounts — each tenant is a sub-meter you can bill against.
      </p>
    </div>
    <Button
      type="button"
      class="w-full justify-center sm:w-auto"
      onclick={() => (openAddTenant = true)}
      aria-haspopup="dialog"
      aria-expanded={openAddTenant}
    >
      <CirclePlus class="size-4" />
      Add Tenant
    </Button>
  </div>

  {#if tenantsQuery.error}
    <div class="flex items-center justify-center py-8 text-muted-foreground">
      Failed to load tenants
    </div>
  {:else if tenantsQuery.current === undefined}
    <div class="flex items-center justify-center py-8 text-muted-foreground">Loading tenants…</div>
  {:else if tenantsQuery.current.length === 0}
    <div
      class="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
    >
      No tenants yet. Create one to start.
    </div>
  {:else}
    <div class="space-y-4">
      {#each tenantsQuery.current as tenant (tenant.id)}
        <Card.Root>
          <Card.Header class="border-b">
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0 space-y-0.5">
                <h2 class="truncate text-sm leading-none font-semibold tracking-tight">
                  {tenant.name}
                </h2>
                <Card.Description class="truncate text-xs">{tenant.email}</Card.Description>
              </div>
              <div class="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={() => openEditDialog(tenant)}
                  aria-haspopup="dialog"
                  aria-expanded={openEdit}
                >
                  <Pencil class="size-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                  aria-label={"Delete " + tenant.name}
                  title={"Delete " + tenant.name}
                  onclick={() => openDeleteDialog(tenant)}
                  aria-haspopup="dialog"
                  aria-expanded={openDelete}
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <ul class="space-y-2 text-sm">
              <li
                class="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <span class="font-medium">Last billed reading</span>
                <span class="min-w-0 text-right text-muted-foreground tabular-nums">
                  {tenant.lastBilledReading ?? "—"}
                </span>
              </li>
              <li
                class="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <span class="font-medium">Latest submission</span>
                <span class="min-w-0 text-right text-muted-foreground tabular-nums">
                  {#if tenant.latestSubmission}
                    {tenant.latestSubmission.reading} ({formatDate(
                      tenant.latestSubmission.createdAt
                    )})
                  {:else}
                    No submission yet
                  {/if}
                </span>
              </li>
            </ul>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Tenant Dialog -->
<DynamicModal
  bind:open={openAddTenant}
  title="Add Tenant"
  description="The tenant will use these credentials to log in and submit meter readings."
  dialogClass="sm:max-w-md"
>
  <form
    id="add-tenant-form"
    {...createTenant.enhance(async ({ submit }) => {
      if (creating) return;
      creating = true;
      try {
        await submit();
        const issues = createTenant.fields.allIssues?.() || [];
        if (issues.length > 0) {
          showWarning(issues.map((i) => i.message).join(", "));
        } else {
          openAddTenant = false;
          showSuccess("Tenant created");
        }
      } catch (e) {
        const message = isHttpError(e) ? e.body.message : String(e);
        showWarning(message || "Failed to create tenant");
      } finally {
        creating = false;
      }
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
        {...createTenant.fields.name.as("text")}
      />
      <Field.Error id="tenant-name-error" errors={createTenant.fields.name.issues()} />
    </Field.Field>
    <Field.Field>
      <Field.Label for="tenant-email" class="px-1">Email</Field.Label>
      <Input
        id="tenant-email"
        placeholder="tenant@example.com"
        required
        aria-describedby="tenant-email-error"
        {...fieldInputProps(createTenant.fields.email.as("email"))}
      />
      <Field.Error id="tenant-email-error" errors={createTenant.fields.email.issues()} />
    </Field.Field>
    <Field.Field>
      <Field.Label for="tenant-password" class="px-1">Password</Field.Label>
      <Input
        id="tenant-password"
        placeholder="At least 8 characters"
        required
        aria-describedby="tenant-password-error"
        {...fieldInputProps(createTenant.fields.password.as("password"))}
      />
      <Field.Error id="tenant-password-error" errors={createTenant.fields.password.issues()} />
    </Field.Field>
  </form>
  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" form="add-tenant-form" disabled={creating}>
        {#if creating}
          <Loader class="size-4 animate-spin" />
          Creating…
        {:else}
          Create Tenant
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>

<!-- Edit Tenant Dialog -->
<DynamicModal
  bind:open={openEdit}
  title="Edit Tenant"
  description={editTarget
    ? `Rename ${editTarget.name}. Their email and credentials stay the same.`
    : ""}
  dialogClass="sm:max-w-md"
>
  {#if editTarget}
    <form
      id="edit-tenant-form"
      {...updateTenant.enhance(async ({ submit }) => {
        try {
          await submit();
          const issues = updateTenant.fields.allIssues?.() || [];
          if (issues.length > 0) {
            showWarning(issues.map((i) => i.message).join(", "));
          } else {
            openEdit = false;
            showSuccess("Tenant updated");
          }
        } catch (e) {
          const message = isHttpError(e) ? e.body.message : String(e);
          showWarning(message || "Failed to update tenant");
        }
      })}
      class="space-y-4"
    >
      <input type="hidden" {...updateTenant.fields.tenantUserId.as("text")} value={editTarget.id} />
      <Field.Field>
        <Field.Label for="edit-tenant-name" class="px-1">Name</Field.Label>
        <Input
          id="edit-tenant-name"
          required
          minlength={2}
          aria-describedby="edit-tenant-name-error"
          {...updateTenant.fields.name.as("text")}
          bind:value={editName}
        />
        <Field.Error id="edit-tenant-name-error" errors={updateTenant.fields.name.issues()} />
      </Field.Field>
    </form>
  {/if}
  {#snippet footer()}
    {#if editTarget}
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" form="edit-tenant-form">Save</Button>
      </div>
    {/if}
  {/snippet}
</DynamicModal>

<!-- Delete Tenant Dialog -->
<DynamicModal
  bind:open={openDelete}
  title="Delete Tenant"
  description={deleteTarget
    ? `This permanently deletes ${deleteTarget.name} and all of their readings and submissions. This cannot be undone.`
    : ""}
  dialogClass="sm:max-w-md"
>
  {#snippet footer()}
    {#if deleteTarget}
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onclick={() => (openDelete = false)}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deleting}
          onclick={async () => {
            if (deleting || !deleteTarget) return;
            deleting = true;
            try {
              await deleteTenant({ tenantUserId: deleteTarget.id });
              openDelete = false;
              showSuccess("Tenant deleted");
            } catch (e) {
              const message = isHttpError(e) ? e.body.message : String(e);
              showWarning(message || "Failed to delete tenant");
            } finally {
              deleting = false;
            }
          }}
        >
          {#if deleting}
            <Loader class="size-4 animate-spin" />
            Deleting…
          {:else}
            Delete Tenant
          {/if}
        </Button>
      </div>
    {/if}
  {/snippet}
</DynamicModal>
