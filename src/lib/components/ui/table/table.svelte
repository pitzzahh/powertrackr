<script lang="ts">
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cn } from "$lib/utils/style.js";
  import type { WithElementRef } from "$/index";

  let {
    ref = $bindable(null),
    class: className,
    children,
    noWrap = false,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> & {
    noWrap?: boolean;
  } = $props();
</script>

{#if noWrap}
  {@render table()}
{:else}
  <div data-slot="table-container" class="relative w-full overflow-x-auto">
    {@render table()}
  </div>
{/if}

{#snippet table()}
  <table
    bind:this={ref}
    data-slot="table"
    class={cn("w-full caption-bottom text-sm", className)}
    {...restProps}
  >
    {@render children?.()}
  </table>
{/snippet}
