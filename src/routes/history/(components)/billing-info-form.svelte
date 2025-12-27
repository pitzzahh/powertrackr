<script lang="ts" module>
  export type BillingInfoFormProps = {
    action: "add" | "update";
    app_state?: "stale" | "processing";
    billingInfo: BillingInfo;
    /**
     * Callback to be called when the form is submitted.
     * This can be used to reset the form or perform other actions.
     * takes true if the form is valid, false otherwise.
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
  import {
    CalendarDate,
    getLocalTimeZone,
    today,
  } from "@internationalized/date";
  import { createBillingInfo } from "$/remotes/billing-info.remote";
  import { Label } from "$/components/ui/label";
  import { ChevronDown } from "$/assets/icons";
  import { Calendar } from "$/components/ui/calendar";
  import * as Card from "$/components/ui/card/index.js";
  import type { BillingInfo } from "$/server/db/schema/billing-info";
  import { formatDate } from "$/utils/format";

  let {
    action,
    app_state = $bindable("stale"),
    billingInfo,
    callback,
  }: BillingInfoFormProps = $props();

  const identity = $props.id();

  let {
    open,
    todayDate,
    dateValue,
  }: {
    open: boolean;
    todayDate: CalendarDate;
    dateValue: CalendarDate | undefined;
  } = $derived({
    open: false,
    todayDate: today(getLocalTimeZone()),
    dateValue: (() => {
      if (action == "add") return undefined; // do not set a date for new entries
      const date = new Date(billingInfo.date);
      return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
    })(),
  });
</script>

<form {...createBillingInfo} class="space-y-4">
  <Field.Group>
    <Field.Field>
      <Label for="{identity}-date" class="px-1">Date</Label>
      <Popover.Root bind:open>
        <Popover.Trigger id="{identity}-date">
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="w-48 justify-between font-normal"
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
                    dateValue = todayDate?.add({ days: preset.value });
                  }}
                >
                  {preset.label}
                </Button>
              {/each}
            </Card.Footer>
          </Card.Root>
        </Popover.Content>
      </Popover.Root>
      <input type="hidden" name="date" value={dateValue?.toString() || ""} />
      <Field.Description>Pick date</Field.Description>
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-balance">Current Balance</Field.Label>
      <Input
        type="text"
        id="{identity}-balance"
        name="balance"
        placeholder="Enter value"
      />
      <Field.Description>Enter text</Field.Description>
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-totalKWh">Total KWh</Field.Label>
      <Input
        type="text"
        id="{identity}-totalKWh"
        name="totalKWh"
        placeholder="Enter value"
      />
      <Field.Description>Enter text</Field.Description>
    </Field.Field>
    <Field.Field>
      <Field.Label for="{identity}-text_d7">Sub KWh</Field.Label>
      <Input
        type="text"
        id="{identity}-text_d7"
        name="text_d7"
        placeholder="Enter value"
      />
      <Field.Description>Enter text</Field.Description>
    </Field.Field>
  </Field.Group>

  <Button type="submit">Submit</Button>
</form>
