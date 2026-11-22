<script lang="ts">
  import * as Select from "#lib/components/ui/select/index.js";
  import type { TimeRangeOption } from "#lib/types/chart.js";
  import { TIME_RANGE_OPTIONS, getSelectedLabel } from ".";

  let {
    value = $bindable(),
    class: className,
  }: { value: TimeRangeOption["value"]; class?: string } = $props();
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger
    size="sm"
    class={["w-36 rounded-lg", className]}
    aria-label="Time range for the charts"
  >
    {getSelectedLabel(value)}
  </Select.Trigger>
  <Select.Content class="max-h-56 rounded-xl">
    {#each TIME_RANGE_OPTIONS as option (option.value)}
      <Select.Item value={option.value} class="rounded-lg">{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
