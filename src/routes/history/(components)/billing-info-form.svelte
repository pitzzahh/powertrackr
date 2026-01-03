<script lang="ts" module>
  export type BillingInfoFormProps = {
    action: "add" | "update";
    app_state?: "stale" | "processing";
    billingInfo?: BillingInfoDTO;
    /**
     * Callback to be called when the form is submitted.
     * This can be used to reset the form or perform other actions.
     */
    callback?: (valid: boolean) => void;
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
  import {
    CalendarDate,
    getLocalTimeZone,
    today,
  } from "@internationalized/date";
  import {
    createBillingInfo,
    updateBillingInfo,
  } from "$/api/billing-info.remote";
  import { Label } from "$/components/ui/label";
  import { ChevronDown } from "$/assets/icons";
  import { Calendar } from "$/components/ui/calendar";
  import * as Card from "$/components/ui/card/index.js";
  import type { BillingInfoDTO } from "$/types/billing-info";
  import { formatDate } from "$/utils/format";
  import { convertToNormalText } from "$/utils/text";
  import { toast } from "svelte-sonner";

  let {
    action,
    app_state = $bindable("stale"),
    billingInfo,
    callback,
  }: BillingInfoFormProps = $props();

  const identity = $props.id();

  let { open, todayDate, dateValue, status, currentAction } = $derived({
    open: false,
    todayDate: today(getLocalTimeZone()),
    dateValue: (() => {
      if (action == "add" || !billingInfo) return undefined; // do not set a date for new entries
      const date = new Date(billingInfo.date);
      return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
    })(),
    status: action === "update" && billingInfo ? billingInfo.status : "pending",
    currentAction: action === "add" ? createBillingInfo : updateBillingInfo,
  });
</script>

<form
  {...currentAction.enhance(async ({ submit }) => {
    const toastId = toast.loading(
      action === "add" ? "Adding billing info..." : "Updating billing info...",
    );
    try {
      try {
        return await submit();
      } catch {
        return callback?.(false);
      }
    } finally {
      toast.dismiss(toastId);
      callback?.(true);
    }
  })}
  class="space-y-4"
>
  {#if action === "update" && billingInfo}
    <input type="hidden" name="id" value={billingInfo.id} />
  {/if}
  <Field.Group>
    <Field.Field>
      <Label for="{identity}-date" class="px-1">Date</Label>
      <Popover.Root bind:open>
        <Popover.Trigger id="{identity}-date">
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="w-full sm:w-48 justify-between font-normal"
            >
              {dateValue
                ? formatDate(dateValue.toDate(getLocalTimeZone()))
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
                    dateValue = todayDate?.add({
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
        {...currentAction.fields.date.as("date")}
        type="hidden"
        value={dateValue?.toString() || ""}
      />
      <Field.Description>Pick date</Field.Description>
      <Field.Error
        errors={currentAction.fields.date.issues()}
        fieldName="Date"
      />
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-balance">Current Balance</Field.Label>
      <Input
        {...currentAction.fields.balance.as("number")}
        id="{identity}-balance"
        placeholder="Enter current balance"
        {...action === "update" &&
          billingInfo && { value: billingInfo.balance.toString() }}
      />
      <Field.Description>Enter balance</Field.Description>
      <Field.Error
        errors={currentAction.fields.balance.issues()}
        fieldName="Current Balance"
      />
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-totalKwh">Total KWh</Field.Label>
      <Input
        {...currentAction.fields.totalKwh.as("number")}
        id="{identity}-totalKwh"
        placeholder="Enter value"
        {...action === "update" &&
          billingInfo && { value: billingInfo.totalKwh.toString() }}
      />
      <Field.Description>Enter total KWh</Field.Description>
      <Field.Error
        errors={currentAction.fields.totalKwh.issues()}
        fieldName="Total KWh"
      />
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-subKwh">Sub KWh</Field.Label>
      <Input
        {...currentAction.fields.subReading.as("number")}
        id="{identity}-subKwh"
        placeholder="Enter value"
        {...action === "update" &&
          billingInfo && {
            value: billingInfo.subReadingLatest.toString(),
          }}
      />
      <Field.Description>Enter sub KWh</Field.Description>
      <Field.Error
        errors={currentAction.fields.subReading.issues()}
        fieldName="Sub KWh"
      />
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-status">Status</Field.Label>
      <Select.Root
        type="single"
        bind:value={status}
        disabled={app_state === "processing" || action === "add"}
      >
        <Select.Trigger id="{identity}-status" class="w-full">
          {convertToNormalText(status) || "Select status"}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Label>Status</Select.Label>
            {#each [{ value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }] as option (option.value)}
              <Select.Item value={option.value} label={option.label}>
                {option.label}
              </Select.Item>
            {/each}
          </Select.Group>status
        </Select.Content>
      </Select.Root>
      <input
        {...currentAction.fields.status.as("text")}
        type="hidden"
        value={status}
      />
      <Field.Description>Select status</Field.Description>
      <Field.Error
        errors={currentAction.fields.status.issues()}
        fieldName="Status"
      />
    </Field.Field>
  </Field.Group>

  <Button class="w-full" type="submit" aria-busy={!!currentAction.pending}>
    {#if action === "add"}
      Add
    {:else}
      Update
    {/if}
  </Button>
</form>
