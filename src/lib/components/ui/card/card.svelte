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
  data-slot="card"
  class={cn(
    "bg-card text-card-foreground flex flex-col gap-6 rounded-md border py-6 shadow-sm",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
