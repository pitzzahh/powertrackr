<script lang="ts">
  import type { WithElementRef } from "$/index";
  import { cn } from "$lib/utils/style.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  bind:this={ref}
  data-slot="command-shortcut"
  class={cn("ms-auto text-xs tracking-widest text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</span>
