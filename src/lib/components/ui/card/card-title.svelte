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
  data-slot="card-title"
  class={cn("leading-none font-semibold", className)}
  {...restProps}
>
  {@render children?.()}
</div>
