<script lang="ts" generics="TData, TValue">
  import { EyeOff, ChevronsUpDown, ArrowUp, ArrowDown } from "$/assets/icons";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Column } from "@tanstack/table-core";
  import type { WithoutChildren } from "bits-ui";
  import { cn } from "$/utils/style";
  import * as DropdownMenu from "$/components/ui/dropdown-menu";
  import Button from "$/components/ui/button/button.svelte";

  type Props = HTMLAttributes<HTMLDivElement> & {
    column: Column<TData, TValue>;
    title: string;
  };

  let {
    column,
    class: className,
    title,
    ...restProps
  }: WithoutChildren<Props> = $props();
</script>

{#if !column?.getCanSort()}
  <div class={className} {...restProps}>
    {title}
  </div>
{:else}
  <div class={cn("flex items-center", className)} {...restProps}>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="sm"
            class="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>
              {title}
            </span>
            {#if column.getIsSorted() === "desc"}
              <ArrowDown />
            {:else if column.getIsSorted() === "asc"}
              <ArrowUp />
            {:else}
              <ChevronsUpDown />
            {/if}
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        <DropdownMenu.Item onclick={() => column.toggleSorting(false)}>
          <ArrowUp class="mr-2 size-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => column.toggleSorting(true)}>
          <ArrowDown class="mr-2 size-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => column.toggleVisibility(false)}>
          <EyeOff class="mr-2 size-3.5 text-muted-foreground/70" />
          Hide
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
{/if}
