<script lang="ts">
  import type { WithElementRef, WithoutChildren } from "$/index";
  import { cn } from "$lib/utils/style.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn("animate-pulse rounded-md bg-accent", className)}
  {...restProps}
></div>
