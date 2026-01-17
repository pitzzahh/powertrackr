<script lang="ts" module>
  export type DataTableSearchFilterProps<TData> = {
    table: Table<TData>;
    where_to_search: keyof TData;
    icon_only?: boolean;
    default_hidden_options?: (keyof TData)[];
  };
</script>

<script lang="ts" generics="TData">
  import { Settings } from "$/assets/icons";
  import type { Table } from "@tanstack/table-core";
  import { buttonVariants } from "$/components/ui/button/index.js";
  import * as DropdownMenu from "$/components/ui/dropdown-menu/index.js";
  import { cn } from "$/utils/style";
  import { convertToNormalText } from "$/utils/text";

  type ComponentState = {
    all_columns: FilterColumn[];
  };

  type FilterColumn = {
    label: keyof TData;
    selected: boolean;
  };
  let {
    table,
    where_to_search = $bindable(),
    icon_only,
    default_hidden_options,
  }: DataTableSearchFilterProps<TData> = $props();

  const comp_state = $derived<ComponentState>({
    all_columns: table
      .getAllColumns()
      .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
      .filter((col) => {
        if (typeof default_hidden_options !== "undefined") {
          return !default_hidden_options.includes(col.id as keyof TData);
        }
        return true;
      })
      .filter((c) => c.getIsVisible())
      .map((c) => {
        return {
          label: c.id,
          selected: false,
        } as FilterColumn;
      }),
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({
      variant: "ghost",
      size: "sm",
      class: "ml-auto hidden h-8 lg:flex",
    })}
  >
    <Settings />
    {#if !icon_only}
      <span>Filter</span>
    {/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Group>
      <DropdownMenu.GroupHeading>Search filter base</DropdownMenu.GroupHeading>
      <DropdownMenu.Separator />
      <DropdownMenu.RadioGroup bind:value={where_to_search as string}>
        {#each comp_state.all_columns as column (column.label)}
          <DropdownMenu.RadioItem
            value={column.label as string}
            class={cn({
              "cursor-not-allowed data-highlighted:bg-destructive":
                column.selected && comp_state.all_columns.filter((c) => c.selected).length <= 1,
            })}
          >
            {convertToNormalText(column.label.toString().replace("_id", ""), true, ["_"])}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
