<script module lang="ts">
  import type { DataTableViewOptionsProps } from "$/components/data-table/data-table-view-options.svelte";
  import type { Table } from "@tanstack/table-core";
  import type { FilterOption } from "$/types/filter";

  export interface BillingInfosDataTableToolbarProps<TData> {
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
  import { Button } from "$/components/ui/button/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import {
    DataTableSearchFilter,
    DataTableViewOptions,
  } from "$/components/data-table";
  import { DataTableFacetedFilter } from "$/components/data-table";
  import { X } from "$/assets/icons.js";
  import { convertToNormalText } from "$/utils/text";
  import { onDestroy } from "svelte";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import type { BillingInfo } from "$/server/db/schema/billing-info";

  let {
    table,
    statuses,
    default_hidden_columns = [],
  }: BillingInfosDataTableToolbarProps<BillingInfo> = $props();

  let { search, where_to_search, timeout } = $state<
    ComponentState<BillingInfo>
  >({
    search: "",
    where_to_search: "date",
  });
  const { is_filtered, status_column } = $derived({
    is_filtered: table.getState().columnFilters.length > 0,
    status_column: table.getColumn("status"),
  });

  onDestroy(() => clearTimeout(timeout));
</script>

<ScrollArea orientation="horizontal" class="scrollbar-hide rounded-none">
  <div class="flex items-center justify-between space-x-2 m-1">
    <div class="flex items-center space-x-2">
      <Input
        placeholder="Filter BillingInfos by {convertToNormalText(
          where_to_search,
        )}..."
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
        class="h-8 w-50 min-w-75 lg:w-min"
      />
      <DataTableSearchFilter {table} bind:where_to_search />
      {#if status_column}
        <DataTableFacetedFilter
          column={status_column}
          title="Payment Status"
          options={statuses}
        />
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
