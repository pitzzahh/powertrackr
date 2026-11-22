<script lang="ts" module>
  import type { RemoteFormField } from "$app/server";
  import type { CalendarDate } from "@internationalized/date";

  export type BillingDateFieldProps = {
    id: string;
    value: CalendarDate | undefined;
    /** The form's date field, kept in sync as a midnight-UTC ISO string. */
    field: RemoteFormField<string>;
  };

  const PRESETS = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "In a week", days: 7 },
    { label: "In 2 weeks", days: 14 },
  ] as const;
</script>

<script lang="ts">
  import { today } from "@internationalized/date";
  import * as Field from "#lib/components/ui/field/index.js";
  import * as Popover from "#lib/components/ui/popover/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Calendar } from "#lib/components/ui/calendar/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { ChevronDown } from "#lib/assets/icons.js";
  import { formatDate } from "#lib/utils/format.js";
  import { toUtcIso } from "./billing-form-utils.js";

  let { id, value = $bindable(), field }: BillingDateFieldProps = $props();

  let open = $state(false);

  function pick(date: CalendarDate | undefined) {
    open = false;
    value = date;
    field.set(toUtcIso(date));
  }
</script>

<Field.Field>
  <Label for={id} class="px-1">Date</Label>
  <Popover.Root bind:open>
    <Popover.Trigger {id}>
      {#snippet child({ props })}
        <Button {...props} variant="outline" class="w-full justify-between font-normal">
          {value ? formatDate(new Date(toUtcIso(value))) : "Select date"}
          <ChevronDown />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto overflow-hidden p-0" align="start">
      <Calendar
        type="single"
        bind:value
        captionLayout="dropdown"
        onValueChange={() => pick(value)}
        class="[--cell-size:--spacing(9.5)]"
      />
      <!-- w-0 min-w-full: the presets wrap to the calendar's width instead of widening it. -->
      <div class="flex w-0 min-w-full flex-wrap gap-2 border-t p-3">
        {#each PRESETS as preset (preset.days)}
          <Button
            variant="outline"
            size="sm"
            class="grow"
            onclick={() => pick(today("UTC").add({ days: preset.days }))}
          >
            {preset.label}
          </Button>
        {/each}
      </div>
    </Popover.Content>
  </Popover.Root>
  <input hidden {...field.as("text")} value={toUtcIso(value)} required />
  <Field.Description>Pick billing date</Field.Description>
</Field.Field>
