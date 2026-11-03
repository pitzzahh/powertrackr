<script lang="ts">
  import {
    Checkbox,
    type CheckboxSize,
    type CheckboxVariant,
  } from "#lib/components/ui/checkbox/index.js";

  type Props = {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    variant?: CheckboxVariant;
    size?: CheckboxSize;
    label?: string;
    description?: string;
    "aria-label"?: string;
    class?: string;
    name?: string;
    onCheckedChange?: (value: boolean) => void;
  };

  let { checked = false, onCheckedChange = (v) => (checked = v), ...restProps }: Props = $props();
</script>

<Checkbox bind:checked={() => checked, onCheckedChange} {...restProps} />
