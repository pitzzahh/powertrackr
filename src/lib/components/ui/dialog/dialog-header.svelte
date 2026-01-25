<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils/style.js";
  import type { WithElementRef } from "$/index";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="dialog-header"
  class={cn("flex flex-col gap-2 text-center sm:text-start -mx-6 border-b px-6 pb-6", className)}
  {...restProps}
>
  {@render children?.()}
</div>
