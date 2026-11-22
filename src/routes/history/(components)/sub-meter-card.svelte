<script lang="ts" module>
  import type { RemoteFormField } from "$app/server";
  import type { Status, SubMeterForm } from "#lib/types/billing-info.js";
  import type { TenantWithMeters } from "#lib/types/tenant.js";

  export type SubMeterCardProps = {
    idPrefix: string;
    index: number;
    entry: SubMeterForm;
    action: "add" | "update";
    /** Pending bill: tenants submit readings later, so none is entered here. */
    pending: boolean;
    tenants: TenantWithMeters[];
    /** Baseline reading this period's usage is measured against. */
    previousReading: number;
    fields: {
      id?: RemoteFormField<string>;
      tenantUserId: RemoteFormField<string>;
      reading: RemoteFormField<number>;
      status: RemoteFormField<Status>;
    };
    onremove: () => void;
    onselecttenant: (tenantUserId: string) => void;
    onusereading: (reading: number) => void;
  };
</script>

<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import * as Field from "#lib/components/ui/field/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import Separator from "#lib/components/ui/separator/separator.svelte";
  import { Trash2 } from "#lib/assets/icons.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { formatDate, formatEnergy } from "#lib/utils/format.js";
  import BillingStatusSelect from "./billing-status-select.svelte";

  let {
    idPrefix,
    index,
    entry,
    action,
    pending,
    tenants,
    previousReading,
    fields,
    onremove,
    onselecttenant,
    onusereading,
  }: SubMeterCardProps = $props();

  const id = $derived(`${idPrefix}-sub-meter-${index}`);
  const tenant = $derived(
    entry.tenantUserId ? tenants.find((t) => t.id === entry.tenantUserId) : undefined
  );
  const latest = $derived(tenant?.latestSubmission);
  const formReading = $derived(Number(fields.reading.value()));
  // Update mode compares against a real baseline; add mode against an entered reading
  const showConsumption = $derived(
    action === "update" ? previousReading > 0 : Number(entry.reading) !== 0
  );
</script>

<Card.Root class="gap-0 border-dashed py-0">
  <Card.Header class="border-b px-4 py-2 [.border-b]:pb-2">
    <div class="flex items-center justify-between">
      <Card.Title class="text-sm">Sub Meter {index + 1}</Card.Title>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={onremove}
        aria-label="Remove sub meter {index + 1}"
        class="size-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 class="size-4" />
      </Button>
    </div>
  </Card.Header>
  <Card.Content class="px-4">
    {#if fields.id}
      <input type="text" hidden {...fields.id.as("text")} />
    {/if}
    <Field.Group class="py-4">
      <Field.Field>
        <Field.Label for="{id}-tenant">Tenant</Field.Label>
        <Select.Root
          type="single"
          bind:value={() => tenant?.id ?? "", (val) => onselecttenant(String(val ?? ""))}
        >
          <Select.Trigger id="{id}-tenant" class="w-full">
            {tenant ? tenant.name : "Select a tenant…"}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Tenant (sub meter)</Select.Label>
              {#each tenants as option (option.id)}
                <Select.Item value={option.id} label={option.name}>
                  {option.name}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <input hidden {...fields.tenantUserId.as("text")} />
        <Field.Description>Sub-meters are tenant accounts.</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="{id}-reading">Current Reading</Field.Label>
        {#if pending}
          <Input id="{id}-reading" disabled placeholder="Awaiting tenant submission" />
          <Field.Description>
            This tenant will submit their reading for this billing period.
          </Field.Description>
        {:else}
          <Input
            id="{id}-reading"
            placeholder="Enter current reading"
            min={action === "update" ? previousReading : (entry.reading ?? 0)}
            step={1}
            required
            {...fieldInputProps(fields.reading.as("number"))}
          />
          <Field.Description>
            {previousReading > 0
              ? `Previous reading: [${previousReading}]`
              : "Current sub-meter reading for calculation"}
          </Field.Description>
        {/if}
      </Field.Field>

      {#if action === "add" && !pending && latest && Number(entry.reading) !== latest.reading}
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Latest tenant reading: {latest.reading} ({formatDate(latest.createdAt)})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => onusereading(latest.reading)}
          >
            Use
          </Button>
        </div>
      {/if}

      <Field.Field>
        <Field.Label for="{id}-status">Status</Field.Label>
        <BillingStatusSelect
          id="{id}-status"
          field={fields.status}
          disabled={action === "add"}
          display={action === "add" ? "Pending" : undefined}
        />
      </Field.Field>

      {#if showConsumption}
        <Separator />
        <div class="text-sm text-muted-foreground">
          Consumption:
          {#if Number.isFinite(formReading)}
            {formatEnergy(formReading - previousReading)}
          {/if}
        </div>
      {/if}
    </Field.Group>
  </Card.Content>
</Card.Root>
