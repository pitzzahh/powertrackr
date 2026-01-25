<script lang="ts" module>
  type Action = "add" | "update";
  export type BillingInfoWithSubMetersFormProps = {
    action: Action;
    billingInfo?: BillingInfoDTOWithSubMeters;
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
  };

  type BillingInfoFormState = {
    dateValue: CalendarDate | undefined;
    status: BillingInfoDTO["status"];
    subMeters: SubMeterForm[];
    open: boolean;
  };
</script>

<script lang="ts">
  import * as Field from "$/components/ui/field";
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input";
  import * as Popover from "$/components/ui/popover";
  import * as Select from "$/components/ui/select";
  import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
  import { getChangedData, omit } from "$/utils/mapper";
  import { createBillingInfo, updateBillingInfo } from "$/api/billing-info.remote";
  import { Label } from "$/components/ui/label";
  import { ChevronDown, CirclePlus, Trash2 } from "$/assets/icons";
  import { Calendar } from "$/components/ui/calendar";
  import * as Card from "$/components/ui/card/index.js";
  import type { BillingInfoDTO, BillingInfoDTOWithSubMeters } from "$/types/billing-info";
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

  let { action, billingInfo, callback }: BillingInfoWithSubMetersFormProps = $props();

  const identity = $props.id();

  let subMeters: BillingInfoFormState["subMeters"] = $state([]);

  let { dateValue, status, open } = $derived<Omit<BillingInfoFormState, "subMeters">>({
    dateValue: undefined,
    status: "Pending",
    open: false,
  });

  const { currentAction } = $derived({
    currentAction: action === "add" ? createBillingInfo : updateBillingInfo,
  });

  let { BILLING_NORMALIZED } = $derived.by(() => {
    const fv = (currentAction?.fields as any)?.value?.() ?? {};
    const out: Record<string, any> = {};
    if (!billingInfo) return { BILLING_NORMALIZED: out };
    for (const key of Object.keys(fv)) {
      if (key === "subMeters") {
        out.subMeters = (billingInfo.subMeters ?? []).map((s: any) => ({
          id: s.id,
          label: s.label,
          reading: s.reading,
        }));
      } else if (key === "date") {
        const d = new Date(billingInfo.date);
        out.date = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()).toString();
      } else if (Object.prototype.hasOwnProperty.call(billingInfo, key)) {
        out[key] = (billingInfo as any)[key];
      } else {
        out[key] = undefined;
      }
    }
    return { BILLING_NORMALIZED: out };
  });

  // CHANGED_DATA: top-level diffs (omitting subMeters) + a cheap sub-meter flag
  let { CHANGED_DATA } = $derived.by(() => {
    const fv = (currentAction?.fields as any)?.value?.() ?? {};
    const topOriginal = omit((BILLING_NORMALIZED as any) ?? {}, ["subMeters"]);
    const topUpdated = omit(fv ?? {}, ["subMeters"]);
    const topChanges = getChangedData(topOriginal, topUpdated);
    const changed: Record<string, any> = { ...topChanges };

    if ("subMeters" in fv) {
      const orig = (BILLING_NORMALIZED as any).subMeters ?? [];
      const form = fv.subMeters ?? [];
      let subsChanged = false;
      if ((orig.length ?? 0) !== (form.length ?? 0)) subsChanged = true;
      else {
        const ids = form.map((s: any) => s.id).filter(Boolean);
        for (const s of form) {
          if (!s.id) {
            subsChanged = true;
            break;
          }
          const ex = orig.find((o: any) => o.id === s.id);
          if (!ex) {
            subsChanged = true;
            break;
          }
          if (ex.label !== s.label || Number(ex.reading) !== Number(s.reading)) {
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
    const dateStr = currentAction.fields.date.value() ?? (dateValue ? dateValue.toString() : "");
    const balanceVal = currentAction.fields.balance.value();
    const totalkWhVal = currentAction.fields.totalkWh.value();
    const statusVal = currentAction.fields.status.value() ?? status;

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
        const mapped: { label: string; reading: number; id?: string } = {
          label: s.label,
          reading: Number(s.reading),
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
    subMeters.push({
      id: crypto.randomUUID(),
      label: "",
      reading: 0,
    });
    // Ensure action fields get updated so change detection picks up new sub-meters
    currentAction?.fields?.subMeters?.set?.(
      subMeters.map((s) => ({ id: s.id, label: s.label, reading: s.reading }))
    );
  }

  // Remove a sub meter
  function removeSubMeter(index: number) {
    if (subMeters.length >= 1) {
      subMeters.splice(index, 1);
      // Sync the action fields after removal
      currentAction?.fields?.subMeters?.set?.(
        subMeters.map((s) => ({ id: s.id, label: s.label, reading: s.reading }))
      );
    }
  }

  // Initialize state from props
  onMount(() => {
    if (action === "update" && billingInfo) {
      // Set date
      const date = new Date(billingInfo.date);
      dateValue = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
      currentAction.fields.date.set(dateValue ? dateValue.toString() : "");
      status = billingInfo.status;
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
            latestDate.getFullYear(),
            latestDate.getMonth() + 2,
            latestDate.getDate()
          )
        : undefined;
      status = "Pending";
      // Sync date with action fields so client-side validation can run
      currentAction?.fields?.date?.set?.(dateValue ? dateValue.toString() : "");
    }

    subMeters =
      billingInfo?.subMeters.map((sub) => ({
        id: sub.id,
        label: sub.label,
        reading: sub.reading,
      })) ?? [];

    currentAction.fields.subMeters.set(
      subMeters.map((s) => ({
        id: s.id,
        label: s.label,
        reading: s.reading,
      }))
    );
  });
</script>

<form
  id="{identity}-form"
  {...currentAction.enhance(async ({ form, submit }) => {
    if (action === "update" && Object.keys(CHANGED_DATA).length === 0) {
      showInspectorWarning();
      return;
    }
    const toastId = showLoading(
      action === "add" ? "Creating billing info..." : "Updating billing info..."
    );
    try {
      await submit();
      const issues = currentAction.fields.allIssues?.() || [];
      if (issues.length > 0) {
        callback?.(false, action, { error: issues.map((i) => i.message).join(", ") });
      } else {
        callback?.(true, action);
      }
      form.reset();
    } catch (error) {
      callback?.(false, action, { error: (error as Error).message });
    } finally {
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
        <Popover.Root bind:open>
          <Popover.Trigger id="{identity}-date">
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="w-full justify-between font-normal">
                {dateValue ? formatDate(dateValue.toDate(getLocalTimeZone())) : "Select date"}
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
                    open = false;
                    // Keep the action fields in sync when the user picks a date
                    currentAction?.fields?.date?.set?.(dateValue ? dateValue.toString() : "");
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
                      dateValue = today(getLocalTimeZone())?.add({
                        days: preset.value,
                      });
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
          value={dateValue ? dateValue.toString() : ""}
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
          bind:value={status}
          disabled={action === "add"}
          onValueChange={(v) => currentAction?.fields?.status?.set?.(v as BillingInfoDTO["status"])}
        >
          <Select.Trigger id="{identity}-status" class="w-full">
            {convertToNormalText(status) || "Select status"}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Status</Select.Label>
              {#each ["Paid", "Pending"] as option (option)}
                <Select.Item value={option} label={option}>
                  {option}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <input hidden {...currentAction.fields.status.as("text")} value={status} />
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
      {@const currentMeter = currentAction.fields.subMeters[subIndex].value()}
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
            <Field.Group>
              <Field.Field>
                <Field.Label for="sub-label-{subMeter.id}">Label</Field.Label>
                <Input
                  id="sub-label-{subMeter.id}"
                  placeholder="Enter Sub meter label"
                  required
                  {...currentAction.fields.subMeters[subIndex]["label"].as("text")}
                />
              </Field.Field>

              <Field.Field>
                <Field.Label for="sub-reading-{subMeter.id}">Current Reading</Field.Label>
                <Input
                  id="sub-reading-{subMeter.id}"
                  placeholder="Enter current reading"
                  min={subMeter.reading}
                  step={1}
                  required
                  {...currentAction.fields.subMeters[subIndex]["reading"].as("number")}
                />
                <Field.Description>
                  {#if currentMeter}
                    Previous reading: [{subMeter.reading}]
                  {:else}
                    Current sub-meter reading for calculation
                  {/if}
                </Field.Description>
              </Field.Field>

              <Separator />

              {#if subMeter?.reading != 0}
                <div class="text-sm text-muted-foreground">
                  Consumption: {isNaN(currentMeter.reading) || currentMeter.reading === 0
                    ? formatEnergy(0)
                    : formatEnergy(currentMeter.reading - subMeter.reading)}
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
      disabled={(action === "update" && Object.keys(CHANGED_DATA).length === 0) || !FORM_VALID}
      title={!FORM_VALID
        ? "Please fix validation errors before submitting"
        : action === "update" && Object.keys(CHANGED_DATA).length === 0
          ? "No changes to update"
          : undefined}
    >
      {action === "add" ? "Create Billing Info" : "Update Billing Info"}
    </Button>
  </div>
</form>
