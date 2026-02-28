<script lang="ts" module>
  type Action = "add" | "update";
  export type BillingInfoWithSubMetersFormProps = {
    action: Action;
    billingInfo?: BillingInfoDTOWithSubMeters;
    open?: boolean;
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

  type SubMeterForm = {
    id: string;
    label: string;
    reading: number;
    status?: Status;
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

  type BillingInfoFormState = {
    dateValue: CalendarDate | undefined;
    subMeters: SubMeterForm[];
    asyncState: AsyncState;
    openDatePicker: boolean;
  };
</script>

<script lang="ts">
  import * as Field from "$/components/ui/field";
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input";
  import * as Popover from "$/components/ui/popover";
  import * as Select from "$/components/ui/select";
  import { CalendarDate, today } from "@internationalized/date";
  import { getChangedData, omit } from "$/utils/mapper";
  import { createBillingInfo, updateBillingInfo } from "$/api/billing-info.remote";
  import { Label } from "$/components/ui/label";
  import { ChevronDown, CirclePlus, Loader, Trash2 } from "$/assets/icons";
  import { Calendar } from "$/components/ui/calendar";
  import * as Card from "$/components/ui/card/index.js";
  import {
    STATUS_VALUES,
    type BillingInfoDTOWithSubMeters,
    type Status,
  } from "$/types/billing-info";
  import { formatDate, formatEnergy } from "$/utils/format";
  import { convertToNormalText } from "$/utils/text";
  import * as v from "valibot";
  import { billFormSchema } from "$/validators/billing-info";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";
  import { showInspectorWarning, showLoading } from "$/components/toast";
  import Separator from "$/components/ui/separator/separator.svelte";
  import { sineInOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import type { AsyncState } from "$/types/state";

  let {
    action,
    open = $bindable(false),
    billingInfo,
    callback,
  }: BillingInfoWithSubMetersFormProps = $props();

  const identity = $props.id();

  let subMeters: BillingInfoFormState["subMeters"] = $state([]);

  let { dateValue, openDatePicker, asyncState } = $derived<Omit<BillingInfoFormState, "subMeters">>(
    {
      dateValue: undefined,
      openDatePicker: false,
      asyncState: "idle",
    }
  );

  const { currentAction } = $derived({
    currentAction: action === "add" ? createBillingInfo : updateBillingInfo,
  });

  let { BILLING_NORMALIZED } = $derived.by(() => {
    const fv = currentAction?.fields?.value?.() ?? {};
    const out: NormalizedBillingData = {};
    if (!billingInfo) return { BILLING_NORMALIZED: out };
    for (const key of Object.keys(fv) as (keyof FormFieldsValue)[]) {
      if (key === "subMeters") {
        out.subMeters = billingInfo.subMeters.map((s) => ({
          id: s.id,
          label: s.label,
          reading: s.reading,
          status: s.status,
        }));
      } else if (key === "date") {
        const d = new Date(billingInfo.date);
        const calDate = new CalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
        // Convert to UTC ISO string to prevent timezone issues during comparison
        out.date = new Date(Date.UTC(calDate.year, calDate.month - 1, calDate.day)).toISOString();
      } else if (key === "id" && billingInfo.id) {
        out.id = billingInfo.id;
      } else if (key === "balance" && typeof billingInfo.balance === "number") {
        out.balance = billingInfo.balance;
      } else if (key === "totalkWh" && typeof billingInfo.totalkWh === "number") {
        out.totalkWh = billingInfo.totalkWh;
      } else if (key === "status" && billingInfo.status) {
        out.status = billingInfo.status;
      }
    }
    return { BILLING_NORMALIZED: out };
  });

  // CHANGED_DATA: top-level diffs (omitting subMeters) + a cheap sub-meter flag
  let { CHANGED_DATA } = $derived.by(() => {
    const fv = currentAction?.fields?.value?.() as FormFieldsValue | undefined;

    // Normalize form values to match NormalizedBillingData types
    const normalizedFv: Partial<NormalizedBillingData> = fv
      ? {
          ...fv,
          balance: typeof fv.balance === "string" ? Number(fv.balance) : fv.balance,
          totalkWh: typeof fv.totalkWh === "string" ? Number(fv.totalkWh) : fv.totalkWh,
        }
      : {};

    const topOriginal = omit(BILLING_NORMALIZED ?? {}, ["subMeters"]);
    const topUpdated = omit(normalizedFv, ["subMeters"]);
    const topChanges = getChangedData(topOriginal, topUpdated);
    const changed: Record<string, any> = { ...topChanges };

    if (fv && "subMeters" in fv) {
      const orig: SubMeterForm[] = BILLING_NORMALIZED.subMeters ?? [];
      const form: SubMeterForm[] = fv.subMeters ?? [];
      let subsChanged = false;
      if ((orig.length ?? 0) !== (form.length ?? 0)) subsChanged = true;
      else {
        const ids = form.map((s) => s.id).filter(Boolean);
        for (const s of form) {
          if (!s.id) {
            subsChanged = true;
            break;
          }
          const ex = orig.find((o) => o.id === s.id);
          if (!ex) {
            subsChanged = true;
            break;
          }
          if (
            ex.label !== s.label ||
            Number(ex.reading) !== Number(s.reading) ||
            ex.status !== s.status
          ) {
            subsChanged = true;
            break;
          }
        }
        if (!subsChanged) {
          for (const ex of orig) {
            if (!ids.includes(ex.id)) {
              subsChanged = true;
              break;
            }
          }
        }
      }
      if (subsChanged) changed.subMeters = true;
    }

    return { CHANGED_DATA: changed };
  });

  let { FORM_VALID } = $derived.by(() => {
    // Read individual fields instead of grabbing the whole form to avoid `as any`
    const dateStr =
      currentAction.fields.date.value() ??
      (dateValue
        ? new Date(Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)).toISOString()
        : "");
    const balanceVal = currentAction.fields.balance.value();
    const totalkWhVal = currentAction.fields.totalkWh.value();
    const statusVal = currentAction.fields.status.value();

    const balance =
      typeof balanceVal === "string" || typeof balanceVal === "number" ? Number(balanceVal) : NaN;
    const totalkWh =
      typeof totalkWhVal === "string" || typeof totalkWhVal === "number"
        ? Number(totalkWhVal)
        : NaN;

    // Build the payload from strongly-typed UI state where possible
    const payloadBase = {
      date: dateStr,
      balance,
      totalkWh,
      status: statusVal,
      subMeters: subMeters.map((s: SubMeterForm) => {
        const mapped: Omit<SubMeterForm, "id"> & {
          id?: string;
        } = {
          label: s.label,
          reading: Number(s.reading),
          status: s.status,
        };
        // Only include `id` for update operations where an id is meaningful
        if (action === "update" && s.id) mapped.id = s.id;
        return mapped;
      }),
    };

    const { success } = v.safeParse(billFormSchema, payloadBase);
    return { FORM_VALID: success };
  });

  // Add a new sub meter
  function addSubMeter() {
    // Get current form values before adding new sub meter
    const currentFormValues = currentAction?.fields?.subMeters?.value?.() ?? [];

    subMeters.push({
      id: crypto.randomUUID(),
      label: "",
      reading: 0,
      status: undefined,
    });

    // Ensure action fields get updated with current form values plus the new sub-meter
    currentAction?.fields?.subMeters?.set?.(
      subMeters.map((s, idx) => {
        // Use current form values if they exist, otherwise use the subMeter values
        if (currentFormValues[idx]) {
          return {
            id: s.id,
            label: currentFormValues[idx].label ?? s.label,
            reading: currentFormValues[idx].reading ?? s.reading,
            status: currentFormValues[idx].status ?? s.status,
          };
        }
        return { id: s.id, label: s.label, reading: s.reading, status: s.status };
      })
    );
  }

  // Remove a sub meter
  function removeSubMeter(index: number) {
    if (subMeters.length >= 1) {
      // Get current form values before removing
      const currentFormValues = currentAction?.fields?.subMeters?.value?.() ?? [];

      subMeters.splice(index, 1);

      // Sync the action fields after removal, preserving current form values
      currentAction?.fields?.subMeters?.set?.(
        subMeters.map((s, idx) => {
          // Map to the correct form value (accounting for the removed index)
          const formIdx = idx < index ? idx : idx + 1;
          if (currentFormValues[formIdx]) {
            return {
              id: s.id,
              label: currentFormValues[formIdx].label ?? s.label,
              reading: currentFormValues[formIdx].reading ?? s.reading,
              status: currentFormValues[formIdx].status ?? s.status,
            };
          }
          return { id: s.id, label: s.label, reading: s.reading, status: s.status };
        })
      );
    }
  }

  // Initialize state from props
  onMount(() => {
    if (action === "update" && billingInfo) {
      // Set date
      const date = new Date(billingInfo.date);
      dateValue = new CalendarDate(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate()
      );
      // Convert CalendarDate to UTC ISO string to prevent timezone issues
      currentAction.fields.date.set(
        dateValue
          ? new Date(Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)).toISOString()
          : ""
      );
      //@ts-expect-error id exists for update action
      currentAction.fields.id.set(billingInfo.id);
      currentAction.fields.balance.set(billingInfo.balance);
      currentAction.fields.totalkWh.set(billingInfo.totalkWh);
      currentAction.fields.status.set(billingInfo.status);
    } else {
      // Add mode - initialize with defaults
      const latestDate = billingInfo && new Date(billingInfo?.date);
      dateValue = latestDate
        ? new CalendarDate(
            latestDate.getUTCFullYear() + (latestDate.getUTCMonth() === 11 ? 1 : 0),
            ((latestDate.getUTCMonth() + 1) % 12) + 1,
            1
          )
        : undefined;
      // Sync date with action fields so client-side validation can run
      // Convert CalendarDate to UTC ISO string to prevent timezone issues
      currentAction?.fields?.date?.set?.(
        dateValue
          ? new Date(Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)).toISOString()
          : ""
      );
    }

    subMeters =
      billingInfo?.subMeters.map((sub) => ({
        id: sub.id,
        label: sub.label,
        reading: sub.reading,
        status: sub.status,
      })) ?? [];

    currentAction.fields.subMeters.set(
      subMeters.map((s) => ({
        id: s.id,
        label: s.label,
        reading: s.reading,
        status: s.status,
      }))
    );
  });
</script>

<form
  id="{identity}-form"
  {...currentAction.enhance(async ({ form, submit }) => {
    if ((action === "update" && Object.keys(CHANGED_DATA).length === 0) || !FORM_VALID) {
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
      form.reset();
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

    <Field.Group>
      {#if action === "update"}
        <Field.Field class="sr-only">
          <Field.Label for="{identity}-id" class="sr-only">Billing Info ID</Field.Label>
          <input
            id="{identity}-id"
            type="text"
            hidden
            {...updateBillingInfo.fields.id.as("text")}
          />
        </Field.Field>
      {/if}

      <Field.Field>
        <Label for="{identity}-date" class="px-1">Date</Label>
        <Popover.Root bind:open={openDatePicker}>
          <Popover.Trigger id="{identity}-date">
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="w-full justify-between font-normal">
                {dateValue
                  ? formatDate(
                      new Date(Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day))
                    )
                  : "Select date"}
                <ChevronDown />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-auto overflow-hidden p-0" align="start">
            <Card.Root class="max-w-75 py-4">
              <Card.Content class="px-4">
                <Calendar
                  type="single"
                  bind:value={dateValue}
                  captionLayout="dropdown"
                  onValueChange={() => {
                    openDatePicker = false;
                    // Keep the action fields in sync when the user picks a date (use UTC ISO string)
                    currentAction?.fields?.date?.set?.(
                      dateValue
                        ? new Date(
                            Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)
                          ).toISOString()
                        : ""
                    );
                  }}
                  class="bg-transparent p-0 [--cell-size:--spacing(9.5)]"
                />
              </Card.Content>
              <Card.Footer class="flex flex-wrap gap-2 border-t px-4 pt-4!">
                {#each [{ label: "Today", value: 0 }, { label: "Tomorrow", value: 1 }, { label: "In 3 days", value: 3 }, { label: "In a week", value: 7 }, { label: "In 2 weeks", value: 14 }] as preset (preset.value)}
                  <Button
                    variant="outline"
                    size="sm"
                    class="flex-1"
                    onclick={() => {
                      openDatePicker = false;
                      const utcToday = today("UTC");
                      dateValue = utcToday?.add({
                        days: preset.value,
                      });
                      currentAction?.fields?.date?.set?.(
                        dateValue
                          ? new Date(
                              Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)
                            ).toISOString()
                          : ""
                      );
                    }}
                  >
                    {preset.label}
                  </Button>
                {/each}
              </Card.Footer>
            </Card.Root>
          </Popover.Content>
        </Popover.Root>
        <input
          hidden
          {...currentAction.fields.date.as("text")}
          value={dateValue
            ? new Date(Date.UTC(dateValue.year, dateValue.month - 1, dateValue.day)).toISOString()
            : ""}
          required
        />
        <Field.Description>Pick billing date</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="{identity}-balance">Total Balance</Field.Label>
        <Input
          id="{identity}-balance"
          placeholder="Enter total balance"
          required
          min={0}
          step={0.01}
          {...currentAction.fields.balance.as("number")}
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
          {...currentAction.fields.totalkWh.as("number")}
        />
        <Field.Description>Total electricity consumption</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="{identity}-status">Status</Field.Label>
        <Select.Root
          type="single"
          disabled={action === "add"}
          onValueChange={(v) => currentAction?.fields.status.set(v as Status)}
        >
          <Select.Trigger id="{identity}-status" class="w-full">
            {convertToNormalText(currentAction.fields.status.value() || "pending")}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Status</Select.Label>
              {#each STATUS_VALUES as option (option)}
                <Select.Item value={option} label={option}>
                  {convertToNormalText(option)}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <input hidden {...currentAction.fields.status.as("text")} />
        <Field.Description>Select billing status</Field.Description>
      </Field.Field>
    </Field.Group>
  </div>

  <!-- Sub Meters Section -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Sub Meters ({subMeters.length})
      </h4>
      <Button variant="outline" size="sm" onclick={addSubMeter}>
        <CirclePlus class="mr-2 size-4" />
        Add Sub Meter
      </Button>
    </div>

    {#each subMeters as subMeter, subIndex (subMeter.id)}
      <div in:scale={{ duration: 250, delay: subIndex * 100, easing: sineInOut }}>
        <Card.Root class="gap-4 border-dashed">
          <Card.Header class="border-b">
            <div class="flex items-center justify-between">
              <Card.Title class="text-sm">Sub Meter {subIndex + 1}</Card.Title>
              {#if subMeters.length >= 1}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => removeSubMeter(subIndex)}
                  class="size-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 class="size-4" />
                </Button>
              {/if}
            </div>
          </Card.Header>
          <Card.Content class="pt-0">
            {#if action === "update"}
              <Field.Field class="sr-only">
                <Field.Label for="{identity}-sub-meter-id" class="sr-only">Sub meter id</Field.Label
                >
                <input
                  id="{identity}-sub-meter-id"
                  type="text"
                  hidden
                  {...updateBillingInfo.fields.subMeters[subIndex]["id"].as("text")}
                />
              </Field.Field>
            {/if}
            <Field.Group class="py-4">
              <Field.Field>
                <Field.Label for="{identity}-sub-meter-label">Label</Field.Label>
                <Input
                  id="{identity}-sub-meter-label"
                  placeholder="Enter Sub meter label"
                  required
                  {...currentAction.fields.subMeters[subIndex]["label"].as("text")}
                />
              </Field.Field>

              <Field.Field>
                <Field.Label for="{identity}-sub-meter-reading">Current Reading</Field.Label>
                <Input
                  id="{identity}-sub-meter-reading"
                  placeholder="Enter current reading"
                  min={subMeter.reading}
                  step={1}
                  required
                  {...currentAction.fields.subMeters[subIndex]["reading"].as("number")}
                />
                <!-- TODO: Fix this, must get previous reading -->
                <Field.Description>
                  {#if subMeter.reading > 0}
                    Previous reading: [{subMeter.reading}]
                  {:else}
                    Current sub-meter reading for calculation
                  {/if}
                </Field.Description>
              </Field.Field>

              <Field.Field>
                <Field.Label for="{identity}-sub-meter-status">Status</Field.Label>
                <Select.Root
                  type="single"
                  disabled={action === "add"}
                  onValueChange={(v) =>
                    currentAction.fields.subMeters[subIndex]["status"].set(v as Status)}
                >
                  <Select.Trigger id="{identity}-sub-meter-status" class="w-full">
                    {#if action === "add"}
                      Pending
                    {:else}
                      {convertToNormalText(
                        currentAction.fields.subMeters[subIndex]["status"].value() ||
                          "Select status"
                      )}
                    {/if}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Group>
                      <Select.Label>Status</Select.Label>
                      {#each STATUS_VALUES as option (option)}
                        <Select.Item value={option} label={option}>
                          {convertToNormalText(option)}
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
                <input hidden {...currentAction.fields.subMeters[subIndex]["status"].as("text")} />
              </Field.Field>

              {#if subMeter?.reading != 0}
                <Separator />
                <div class="text-sm text-muted-foreground">
                  Consumption:
                  {#if Number.isFinite(Number(currentAction?.fields?.subMeters?.[subIndex]?.["reading"]?.value?.()))}
                    {formatEnergy(
                      Number(currentAction?.fields?.subMeters?.[subIndex]?.["reading"]?.value?.()) -
                        Number(subMeter.reading)
                    )}
                  {/if}
                </div>
              {/if}
            </Field.Group>
          </Card.Content>
        </Card.Root>
      </div>
    {/each}
  </div>
  <!-- Submit Button -->
  <div class="mt-4 flex">
    <Button
      type="submit"
      form="{identity}-form"
      class="ml-auto min-w-32"
      disabled={asyncState === "processing" ||
        (action === "update" && Object.keys(CHANGED_DATA).length === 0) ||
        !FORM_VALID}
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
</form>
