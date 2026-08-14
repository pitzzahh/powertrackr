<script module lang="ts">
  import type { DataTableViewOptionsProps } from "#lib/components/data-table/data-table-view-options.svelte";
  import type { RowData } from "@tanstack/table-core";
  import type { SvelteTable as Table } from "#lib/components/ui/data-table/index.js";
  import type { FilterOption } from "#lib/types/filter.js";

  export interface BillingInfosDataTableToolbarProps<TData extends RowData> {
    table: Table<TData>;
    statuses: FilterOption<string>[];
    default_hidden_columns?: DataTableViewOptionsProps<TData>["default_hidden_columns"];
  }

  type ComponentState<TData> = {
    search: string;
    where_to_search: keyof TData;
    timeout?: number;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { DataTableSearchFilter, DataTableViewOptions } from "#lib/components/data-table/index.js";
  import { DataTableFacetedFilter } from "#lib/components/data-table/index.js";
  import { X } from "#lib/assets/icons.js";
  import { convertToNormalText } from "#lib/utils/text.js";
  import { onDestroy } from "svelte";
  import { ScrollArea } from "#lib/components/ui/scroll-area/index.js";
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";

  let {
    table,
    statuses,
    default_hidden_columns = [],
  }: BillingInfosDataTableToolbarProps<ExtendedBillingInfoTableView> = $props();

  let { search, where_to_search, timeout } = $state<ComponentState<ExtendedBillingInfoTableView>>({
    search: "",
    where_to_search: "date",
  });
  const { is_filtered, status_column } = $derived({
    is_filtered: table.atoms.columnFilters.get().length > 0,
    status_column: table.getColumn("status"),
  });

  onDestroy(() => clearTimeout(timeout));
</script>

<ScrollArea orientation="horizontal" class="rounded-none">
  <div class="flex min-w-max items-center justify-between gap-2 p-1">
    <div class="flex min-w-max items-center gap-2">
      <Input
        placeholder="Filter billing records by {convertToNormalText(where_to_search)}..."
        bind:value={
          () => search,
          (v) => {
            clearTimeout(timeout);
            search = v;
            timeout = window.setTimeout(() => {
              table.getColumn(where_to_search)?.setFilterValue(v);
            }, 500);
          }
        }
        type="search"
        class="h-8 w-50 min-w-75 lg:w-auto"
      />
      <DataTableSearchFilter {table} bind:where_to_search />
      {#if status_column}
        <DataTableFacetedFilter column={status_column} title="Payment Status" options={statuses} />
      {/if}
      {#if is_filtered}
        <Button
          variant="ghost"
          onclick={() => {
            search = "";
            table.resetColumnFilters();
          }}
          class="h-8 px-2 lg:px-3"
        >
          Reset
          <X />
        </Button>
      {/if}
    </div>
    <DataTableViewOptions {table} {default_hidden_columns} />
  </div>
</ScrollArea>
