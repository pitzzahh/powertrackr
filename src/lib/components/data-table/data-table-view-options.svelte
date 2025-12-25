<script module lang="ts">
  export interface DataTableViewOptionsProps<TData> {
    table: Table<TData>;
    default_hidden_columns?: (keyof TData)[];
  }
</script>

<script lang="ts" generics="TData">
  import { ChevronDown, TwoColumns } from "$/assets/icons";
  import type { Table } from "@tanstack/table-core";
  import { Button } from "$/components/ui/button/index.js";
  import * as DropdownMenu from "$/components/ui/dropdown-menu/index.js";
  import { untrack } from "svelte";

  let {
    table,
    default_hidden_columns = $bindable([]),
  }: DataTableViewOptionsProps<TData> = $props();

  $effect(() => {
    if (!default_hidden_columns) return;
    untrack(() => {
      table.getAllColumns().forEach((col) => {
        if (default_hidden_columns.includes(col.id as keyof TData)) {
          col.toggleVisibility(false);
        }
      });
    });
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="sm" {...props}>
        <TwoColumns />
        <span class="hidden lg:inline">Customize Columns</span>
        <span class="lg:hidden">Columns</span>
        <ChevronDown />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-56">
    {#each table
      .getAllColumns()
      .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
      <DropdownMenu.CheckboxItem
        class="capitalize"
        checked={column.getIsVisible()}
        onCheckedChange={(value) => {
          if (
            table
              .getAllColumns()
              .filter(
                (col) =>
                  typeof col.accessorFn !== "undefined" && col.getCanHide(),
              )
              .filter((col) => col.getIsVisible()).length <= 1 &&
            !value
          ) {
            return;
          }
          column.toggleVisibility(!!value);
        }}
      >
        {column.id}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
