<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { CirclePlus } from "#lib/assets/icons.js";
  import { getTenants } from "#lib/api/tenant.remote.js";
  import type { TenantWithMeters } from "#lib/types/tenant.js";
  import TenantCard from "./(components)/tenant-card.svelte";
  import AddTenantDialog from "./(components)/add-tenant-dialog.svelte";
  import EditTenantDialog from "./(components)/edit-tenant-dialog.svelte";
  import DeleteTenantDialog from "./(components)/delete-tenant-dialog.svelte";

  // The query drives the page reactively. Mutations refresh it server-side
  // (single-flight), so `current` updates without any client-side re-fetch.
  const tenantsQuery = getTenants({});

  let openAdd = $state(false);
  let openEdit = $state(false);
  let openDelete = $state(false);
  let target = $state<TenantWithMeters | null>(null);
</script>

<div class="space-y-6 pb-4">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Tenants</h1>
      <p class="text-muted-foreground">
        Create tenant accounts — each tenant is a sub-meter you can bill against.
      </p>
    </div>
    <Button
      type="button"
      class="w-full justify-center sm:w-auto"
      onclick={() => (openAdd = true)}
      aria-haspopup="dialog"
      aria-expanded={openAdd}
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
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each tenantsQuery.current as tenant (tenant.id)}
        <TenantCard
          {tenant}
          onedit={() => {
            target = tenant;
            openEdit = true;
          }}
          ondelete={() => {
            target = tenant;
            openDelete = true;
          }}
        />
      {/each}
    </div>
  {/if}
</div>

<AddTenantDialog bind:open={openAdd} />
<EditTenantDialog bind:open={openEdit} tenant={target} />
<DeleteTenantDialog bind:open={openDelete} tenant={target} />
