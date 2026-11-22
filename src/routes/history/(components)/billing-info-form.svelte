<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { BillingInfoWithSubMeters, Status, SubMeterForm } from "#lib/types/billing-info.js";

  type Action = "add" | "update";
  export type BillingInfoWithSubMetersFormProps = {
    action: Action;
    billingInfo?: BillingInfoWithSubMeters;
    /**
     * For update mode: the billing record immediately before the one being
     * edited, used to display the true previous reading per sub meter.
     */
    previousBillingInfo?: BillingInfoWithSubMeters;
    open?: boolean;
    title: string;
    description?: string;
    /** Optional element that opens the dialog (DynamicModal's trigger). */
    trigger?: Snippet<[{ props: Record<string, unknown> }]>;
    /** Shown above the form, e.g. a "prefilling…" hint. */
    notice?: Snippet;
    /**
     * Callback to be called when the form is submitted.
     */
    callback?: (
      valid: boolean,
      action: Action,
      metaData?: {
        error?: string;
      }
    ) => void;
  };
  type NormalizedBillingData = {
    id?: string;
    date?: string;
    balance?: number;
    totalkWh?: number;
    status?: Status;
    subMeters?: SubMeterForm[];
  };

  type FormFieldsValue = {
    id?: string;
    date?: string;
    balance?: number | string;
    totalkWh?: number | string;
    status?: Status;
    subMeters?: SubMeterForm[];
  };
</script>

<script lang="ts">
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Checkbox } from "#lib/components/ui/checkbox/index.js";
  import { CirclePlus, Loader } from "#lib/assets/icons.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { getChangedData, omit } from "#lib/utils/mapper.js";
  import { resolvePreviousReadings } from "#lib/utils/previous-reading.js";
  import { createBillingInfo, updateBillingInfo } from "#lib/api/billing-info.remote.js";
  import { getTenants } from "#lib/api/tenant.remote.js";
  import { toStatus } from "#lib/validators/shared.js";
  import { isBillFormValid } from "#lib/validators/billing-info.js";
  import { showInspectorWarning, showLoading } from "#lib/components/toast/index.js";
  import { toast } from "svelte-sonner";
  import { watch } from "runed";
  import type { CalendarDate } from "@internationalized/date";
  import type { TenantWithMeters } from "#lib/types/tenant.js";
  import type { AsyncState } from "#lib/types/state.js";
  import BillingDateField from "./billing-date-field.svelte";
  import BillingStatusSelect from "./billing-status-select.svelte";
  import SubMeterCard from "./sub-meter-card.svelte";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { showWarning } from "#lib/components/toast/index.js";
  import {
    firstOfNextMonth,
    subMetersChanged,
    toCalendarDate,
    toFieldEntries,
    toUtcIso,
  } from "./billing-form-utils.js";

  let {
    action,
    open = $bindable(false),
    billingInfo,
    previousBillingInfo,
    callback,
    title,
    description,
    trigger,
    notice,
  }: BillingInfoWithSubMetersFormProps = $props();

  const identity = $props.id();

  let subMeters: SubMeterForm[] = $state([]);
  let tenants: TenantWithMeters[] = $state([]);
  // Add mode only: create the billing as pending and let tenants submit
  // readings for it before the owner finalizes.
  let pending = $state(false);
  let dateValue: CalendarDate | undefined = $state();
  let asyncState: AsyncState = $state("idle");

  const currentAction = $derived(action === "add" ? createBillingInfo : updateBillingInfo);

  // Previous period readings per sub meter (by id), used in update mode to show
  // the true baseline instead of the record's own stored reading.
  const previousReadings = $derived(
    action === "update" && previousBillingInfo
      ? resolvePreviousReadings(subMeters, previousBillingInfo.subMeters)
      : new Map<string, number>()
  );

  const BILLING_NORMALIZED = $derived.by((): NormalizedBillingData => {
    if (!billingInfo) return {};
    return {
      id: billingInfo.id,
      date: toUtcIso(toCalendarDate(billingInfo.date)),
      balance: billingInfo.balance,
      totalkWh: billingInfo.totalkWh,
      status: toStatus(billingInfo.status),
      subMeters: billingInfo.subMeters.map((s) => ({
        id: s.id,
        tenantUserId: s.tenantUserId,
        reading: s.reading,
        status: s.status,
      })),
    };
  });

  // Top-level diffs (omitting subMeters) plus a flag when any sub meter changed
  const CHANGED_DATA = $derived.by(() => {
    const fv = currentAction.fields.value() as FormFieldsValue | undefined;
    if (!fv) return {};
    const current = omit(
      {
        ...fv,
        balance: typeof fv.balance === "string" ? Number(fv.balance) : fv.balance,
        totalkWh: typeof fv.totalkWh === "string" ? Number(fv.totalkWh) : fv.totalkWh,
      },
      ["subMeters"]
    );
    // Only compare keys the form actually holds
    const saved = Object.fromEntries(
      Object.entries(omit(BILLING_NORMALIZED, ["subMeters"])).filter(([k]) => k in fv)
    );
    const changed: Record<string, unknown> = getChangedData(saved, current);
    if (
      "subMeters" in fv &&
      subMetersChanged(BILLING_NORMALIZED.subMeters ?? [], fv.subMeters ?? [])
    ) {
      changed.subMeters = true;
    }
    return changed;
  });

  const FORM_VALID = $derived(
    isBillFormValid({
      date: currentAction.fields.date.value() ?? toUtcIso(dateValue),
      balance: toNumber(currentAction.fields.balance.value()),
      totalkWh: toNumber(currentAction.fields.totalkWh.value()),
      status: currentAction.fields.status.value(),
      subMeters: subMeters.map((s) => ({
        tenantUserId: s.tenantUserId,
        status: s.status,
        ...(s.reading != null && { reading: Number(s.reading) }),
        // Only include `id` for update operations where an id is meaningful
        ...(action === "update" && !s.isNew && { id: s.id }),
      })),
    })
  );

  const CAN_SUBMIT = $derived(
    FORM_VALID && !(action === "update" && Object.keys(CHANGED_DATA).length === 0)
  );

  // Re-initialize whenever the form opens, so a reopen after a successful add
  // prefills from the latest record instead of stale state. `watch` runs the
  // callback untracked, so only `open` changes trigger it — one init per open.
  watch(
    () => open,
    (isOpen) => {
      if (isOpen) initialize();
    }
  );

  function initialize() {
    if (action === "update" && billingInfo) {
      dateValue = toCalendarDate(billingInfo.date);
      //@ts-expect-error id exists for update action
      currentAction.fields.id.set(billingInfo.id);
      currentAction.fields.balance.set(billingInfo.balance);
      currentAction.fields.totalkWh.set(billingInfo.totalkWh);
      currentAction.fields.status.set(toStatus(billingInfo.status));
    } else {
      pending = false;
      dateValue = billingInfo ? firstOfNextMonth(billingInfo.date) : undefined;
    }
    // Sync date with action fields so client-side validation can run
    currentAction.fields.date.set(toUtcIso(dateValue));

    subMeters =
      billingInfo?.subMeters.map((sub) => ({
        id: sub.id,
        tenantUserId: sub.tenantUserId,
        reading: sub.reading,
        status: sub.status,
      })) ?? [];
    syncSubMeterFields();

    getTenants({})
      .then((result) => {
        tenants = (result as TenantWithMeters[]) ?? [];
      })
      .catch(() => {
        tenants = [];
      });
  }

  function setPending(value: boolean) {
    pending = value;
    if (!value) return;
    // Clear readings — tenants will submit them for this billing period
    for (const s of subMeters) s.reading = null;
    const typed = currentAction.fields.subMeters.value() ?? [];
    currentAction.fields.subMeters.set(
      toFieldEntries(subMeters).map((s, idx) => ({ ...s, status: typed[idx]?.status ?? s.status }))
    );
  }

  function addSubMeter() {
    keepTypedValues(() =>
      subMeters.push({
        id: crypto.randomUUID(),
        isNew: true,
        tenantUserId: "",
        reading: pending ? null : 0,
        status: undefined,
      })
    );
  }

  function removeSubMeter(index: number) {
    keepTypedValues(() => subMeters.splice(index, 1), index);
  }

  // Select an existing tenant for an entry (sub-meters ARE tenants)
  function selectTenant(index: number, tenantUserId: string) {
    const entry = subMeters[index];
    if (!entry) return;
    const tenant = tenants.find((t) => t.id === tenantUserId);
    const typedReading = currentAction.fields.subMeters.value()?.[index]?.reading;
    keepTypedValues(
      () => {
        entry.tenantUserId = tenant?.id ?? "";
        if (tenant && !pending) {
          entry.reading =
            tenant.latestSubmission?.reading ??
            tenant.lastBilledReading ??
            typedReading ??
            entry.reading;
        }
      },
      undefined,
      index
    );
  }

  function syncSubMeterFields() {
    currentAction.fields.subMeters.set(toFieldEntries(subMeters));
  }

  /**
   * Run a change to the sub-meter list, then push the list to the form while
   * keeping what the user already typed into each row. Rows are matched by
   * position (add-form rows carry no id), skipping `removedIndex`; the
   * `changedIndex` row takes its values from the state the change just set.
   */
  function keepTypedValues(change: () => void, removedIndex?: number, changedIndex?: number) {
    const typed = currentAction.fields.subMeters.value() ?? [];
    change();
    currentAction.fields.subMeters.set(
      toFieldEntries(subMeters).map((s, idx) => {
        const t =
          idx === changedIndex
            ? undefined
            : typed[removedIndex !== undefined && idx >= removedIndex ? idx + 1 : idx];
        return t
          ? {
              id: s.id,
              tenantUserId: t.tenantUserId ?? s.tenantUserId,
              reading: t.reading ?? s.reading,
              status: t.status ?? s.status,
            }
          : s;
      })
    );
  }

  function previousReadingFor(entry: SubMeterForm): number {
    if (action === "update") return previousReadings.get(entry.id) ?? 0;
    if (!entry.tenantUserId) return 0;
    return billingInfo?.subMeters.find((s) => s.tenantUserId === entry.tenantUserId)?.reading ?? 0;
  }

  function toNumber(value: unknown): number {
    return typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  }
</script>

<DynamicModal
  bind:open
  onOpenChange={(next) => {
    if (!next && asyncState === "processing") {
      showWarning("Process Interrupted", "The operation is still processing. Please wait...");
      open = true;
    }
  }}
  {title}
  {description}
  {trigger}
  size="lg"
>
  {@render notice?.()}
  <form
    id="{identity}-form"
    class="flex flex-col gap-6"
    {...currentAction.enhance(async ({ submit, element }) => {
      if (!CAN_SUBMIT) {
        showInspectorWarning();
        return;
      }
      const toastId = showLoading(
        action === "add" ? "Creating billing info..." : "Updating billing info..."
      );
      try {
        asyncState = "processing";
        await submit();
        const issues = currentAction.fields.allIssues?.() || [];
        if (issues.length > 0) {
          callback?.(false, action, { error: issues.map((i) => i.message).join(", ") });
        } else {
          open = false;
          callback?.(true, action);
        }
        element.reset();
      } catch (error) {
        callback?.(false, action, { error: (error as Error).message });
      } finally {
        asyncState = "idle";
        toast.dismiss(toastId);
      }
    })}
  >
    <!-- Main Billing Info Fields -->
    <div class="space-y-4">
      <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Billing Details
      </h4>

      <Field.Group class="grid gap-4 md:grid-cols-2">
        {#if action === "update"}
          <input type="text" hidden {...updateBillingInfo.fields.id.as("text")} />
        {/if}

        <BillingDateField
          id="{identity}-date"
          bind:value={dateValue}
          field={currentAction.fields.date}
        />

        <Field.Field>
          <Field.Label for="{identity}-balance">Total Balance</Field.Label>
          <Input
            id="{identity}-balance"
            placeholder="Enter total balance"
            required
            min={0}
            step={0.01}
            {...fieldInputProps(currentAction.fields.balance.as("number"))}
          />
          <Field.Description>Total billing amount</Field.Description>
        </Field.Field>

        <Field.Field>
          <Field.Label for="{identity}-totalkWh">Total kWh</Field.Label>
          <Input
            id="{identity}-totalkWh"
            placeholder="Enter total kWh"
            required
            min={0}
            step={1}
            {...fieldInputProps(currentAction.fields.totalkWh.as("number"))}
          />
          <Field.Description>Total electricity consumption</Field.Description>
        </Field.Field>

        <Field.Field>
          <Field.Label for="{identity}-status">Status</Field.Label>
          <BillingStatusSelect
            id="{identity}-status"
            field={currentAction.fields.status}
            disabled={action === "add"}
            fallback="pending"
          />
          <Field.Description>Select billing status</Field.Description>
        </Field.Field>
      </Field.Group>
    </div>

    <!-- Sub Meters Section -->
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h4
          class="text-sm font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase"
        >
          Sub Meters ({subMeters.length})
        </h4>
        <Button type="button" variant="outline" size="sm" onclick={addSubMeter}>
          <CirclePlus class="mr-2 size-4" />
          Add Sub Meter
        </Button>
        {#if action === "add"}
          <label
            class="flex basis-full cursor-pointer items-center gap-2 text-sm text-muted-foreground"
          >
            <Checkbox bind:checked={() => pending, (c) => setPending(c)} />
            Create as pending (tenants submit readings)
          </label>
        {/if}
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        {#each subMeters as entry, index (entry.id)}
          {@const row = currentAction.fields.subMeters[index]}
          <SubMeterCard
            idPrefix={identity}
            {index}
            {entry}
            {action}
            {pending}
            {tenants}
            previousReading={previousReadingFor(entry)}
            fields={{
              id: action === "update" ? updateBillingInfo.fields.subMeters[index].id : undefined,
              tenantUserId: row.tenantUserId,
              reading: row.reading,
              status: row.status,
            }}
            onremove={() => removeSubMeter(index)}
            onselecttenant={(tenantUserId) => selectTenant(index, tenantUserId)}
            onusereading={(reading) => {
              entry.reading = reading;
              row.reading.set(reading);
            }}
          />
        {/each}
      </div>
    </div>
  </form>

  {#snippet footer()}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        disabled={asyncState === "processing"}
        onclick={() => (open = false)}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="{identity}-form"
        class="min-w-32"
        disabled={asyncState === "processing" || !CAN_SUBMIT}
        title={!FORM_VALID
          ? "Please fix validation errors before submitting"
          : action === "update" && Object.keys(CHANGED_DATA).length === 0
            ? "No changes to update"
            : undefined}
      >
        {#if asyncState === "processing"}
          <Loader class="size-5 animate-spin" />
          Please wait
        {:else}
          {action === "add" ? "Create Billing Info" : "Update Billing Info"}
        {/if}
      </Button>
    </div>
  {/snippet}
</DynamicModal>
