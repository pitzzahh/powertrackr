<script lang="ts" module>
  import type { RemoteFormField } from "$app/server";
  import type { Status } from "#lib/types/billing-info.js";

  export type BillingStatusSelectProps = {
    id: string;
    field: RemoteFormField<Status>;
    disabled?: boolean;
    /** Value shown and bound when the field is empty. */
    fallback?: Status | "";
    /** Trigger text when nothing is selected. */
    placeholder?: string;
    /** Fixed trigger text, overriding the selected value. */
    display?: string;
  };
</script>

<script lang="ts">
  import * as Select from "#lib/components/ui/select/index.js";
  import { STATUS_VALUES } from "#lib/validators/shared.js";
  import { convertToNormalText } from "#lib/utils/text.js";

  let {
    id,
    field,
    disabled = false,
    fallback = "",
    placeholder = "Select status",
    display,
  }: BillingStatusSelectProps = $props();
</script>

<Select.Root
  type="single"
  {disabled}
  bind:value={() => field.value() || fallback, (v) => field.set(v as Status)}
>
  <Select.Trigger {id} class="w-full">
    {display ?? convertToNormalText(field.value() || fallback || placeholder)}
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
<input hidden {...field.as("text")} />
