<script module lang="ts">
  import type { RowData } from "@tanstack/table-core";
  export interface DataTableViewOptionsProps<TData extends RowData> {
    table: Table<TData>;
    default_hidden_columns?: (keyof TData)[];
  }
</script>

<script lang="ts" generics="TData extends RowData">
  import { ChevronDown, TwoColumns } from "#lib/assets/icons.js";
  import type { SvelteTable as Table } from "#lib/components/ui/data-table/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
  import { untrack } from "svelte";

  let { table, default_hidden_columns = $bindable([]) }: DataTableViewOptionsProps<TData> =
    $props();

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
              .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
              .filter((col) => col.getIsVisible()).length <= 1 &&
            !value
          ) {
            return;
          }
          column.toggleVisibility(!!value);
        }}
      >
        {column.id.replace("Formatted", "")}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
