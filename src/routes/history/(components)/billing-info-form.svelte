<script lang="ts" module>
  export type BillingInfoWithSubMetersFormProps = {
    action: "add" | "update";
    billingInfo?: BillingInfoDTO;
    /**
     * Callback to be called when the form is submitted.
     */
    callback?: (
      valid: boolean,
      action: "add" | "update",
      metaData?: {
        error?: string;
      }
    ) => void;
  };

  type SubMeterForm = {
    id: string;
    subReadingLatest: number;
    subReadingOld: number | undefined;
  };

  type BillingInfoFormState = {
    dateValue: CalendarDate | undefined;
    status: string;
    subMeters: SubMeterForm[];
    open: boolean;
  };
</script>

<script lang="ts">
  // Field Components
  import * as Field from "$/components/ui/field";
  // UI Components
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input";
  import * as Popover from "$/components/ui/popover";
  import * as Select from "$/components/ui/select";
  import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
  import { createBillingInfo, updateBillingInfo } from "$/api/billing-info.remote";
  import { Label } from "$/components/ui/label";
  import { ChevronDown, CirclePlus, Trash2 } from "$/assets/icons";
  import { Calendar } from "$/components/ui/calendar";
  import * as Card from "$/components/ui/card/index.js";
  import type { BillingInfoDTO } from "$/types/billing-info";
  import { formatDate } from "$/utils/format";
  import { convertToNormalText } from "$/utils/text";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";
  import { showLoading } from "$/components/toast";

  let { action, billingInfo, callback }: BillingInfoWithSubMetersFormProps = $props();

  const identity = $props.id();

  let { dateValue, status, open, subMeters } = $state<BillingInfoFormState>({
    dateValue: undefined,
    status: "pending",
    subMeters: [],
    open: false,
  });

  const { currentAction } = $derived({
    currentAction: action === "add" ? createBillingInfo : updateBillingInfo,
  });

  // Add a new sub meter
  function addSubMeter() {
    subMeters.push({
      id: crypto.randomUUID(),
      subReadingLatest: 0,
      subReadingOld: undefined,
    });
  }

  // Remove a sub meter
  function removeSubMeter(index: number) {
    if (subMeters.length >= 1) {
      subMeters.splice(index, 1);
    }
  }

  // Initialize state from props
  onMount(() => {
    if (action === "update" && billingInfo) {
      // Set date
      const date = new Date(billingInfo.date);
      dateValue = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

      // Set other fields
      status = billingInfo.status;

      // Initialize sub meters if they exist
      // Note: This assumes billingInfo has subMeters property, adjust if needed
      subMeters.length = 0;
      if ((billingInfo as any).subMeters) {
        subMeters.push(
          ...(billingInfo as any).subMeters.map((sub: any) => ({
            id: crypto.randomUUID(),
            subReadingLatest: sub.subReadingLatest || 0,
            subReadingOld: sub.subReadingOld || undefined,
          }))
        );
      }
    } else {
      // Add mode - initialize with defaults
      dateValue = today(getLocalTimeZone());
      status = "pending";
      subMeters.length = 0; // Start with no sub meters
    }
  });
</script>

<form
  {...currentAction.enhance(async ({ data, submit }) => {
    const toastId = showLoading(
      action === "add" ? "Creating billing info..." : "Updating billing info..."
    );
    try {
      console.log({
        data,
      });
      await submit();
      callback?.(true, action);
    } catch (error) {
      callback?.(false, action, { error: (error as Error).message });
    } finally {
      toast.dismiss(toastId);
    }
  })}
  class="space-y-6"
>
  <!-- Main Billing Info Fields -->
  <div class="space-y-4">
    <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
      Billing Details
    </h4>

    <Field.Group>
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
        <input hidden name="date" value={dateValue ? dateValue.toString() : ""} required />
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
        <Field.Label for="{identity}-totalKWh">Total kWh</Field.Label>
        <Input
          id="{identity}-totalKWh"
          placeholder="Enter total kWh"
          required
          min={0}
          step={0.01}
          {...currentAction.fields.totalKWh.as("number")}
        />
        <Field.Description>Total electricity consumption</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="{identity}-status">Status</Field.Label>
        <Select.Root type="single" bind:value={status} disabled={action === "add"}>
          <Select.Trigger id="{identity}-status" class="w-full">
            {convertToNormalText(status) || "Select status"}
          </Select.Trigger>
          <Select.Content {...currentAction.fields.status.as("select")}>
            <Select.Group>
              <Select.Label>Status</Select.Label>
              {#each [{ value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }] as option (option.value)}
                <Select.Item value={option.value} label={option.label}>
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
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
        <CirclePlus class="mr-2 h-4 w-4" />
        Add Sub Meter
      </Button>
    </div>

    {#each subMeters as subMeter, subIndex (subMeter.id)}
      <Card.Root class="border-dashed">
        <Card.Header class="pb-3">
          <div class="flex items-center justify-between">
            <Card.Title class="text-sm">Sub Meter {subIndex + 1}</Card.Title>
            {#if subMeters.length >= 1}
              <Button
                variant="ghost"
                size="sm"
                onclick={() => removeSubMeter(subIndex)}
                class="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="pt-0">
          <Field.Group>
            <Field.Field>
              <Field.Label for="sub-latest-{subMeter.id}">Current Reading</Field.Label>
              <Input
                id="sub-latest-{subMeter.id}"
                placeholder="Enter current reading"
                min={0}
                step={0.01}
                {...currentAction.fields.subMeters[subIndex]["subReadingLatest"].as("number")}
              />
              <Field.Description>Latest meter reading</Field.Description>
            </Field.Field>

            <Field.Field>
              <Field.Label for="sub-old-{subMeter.id}">Previous Reading (Optional)</Field.Label>
              <Input
                id="sub-old-{subMeter.id}"
                placeholder="Enter previous reading"
                min={0}
                step={0.01}
                {...currentAction.fields.subMeters[subIndex]["subReadingOld"].as("number")}
              />
              <Field.Description>Previous meter reading for calculation</Field.Description>
            </Field.Field>

            {#if subMeter.subReadingLatest && subMeter.subReadingOld && subMeter.subReadingLatest > subMeter.subReadingOld}
              <div class="text-sm text-muted-foreground">
                Consumption: {subMeter.subReadingLatest - subMeter.subReadingOld} kWh
              </div>
            {/if}
          </Field.Group>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <!-- Submit Button -->
  <div class="flex justify-end pt-4">
    <Button type="submit" class="min-w-32">
      {action === "add" ? "Create Billing Info" : "Update Billing Info"}
    </Button>
  </div>
</form>
