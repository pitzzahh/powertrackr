<script module lang="ts">
  import type { DataTablePaginationProps } from "./data-table-pagination.svelte";
  export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    data_table_toolbar?: Snippet<[{ table: TableCore<TData> }]>;
    floating_bar?: Snippet<[{ table: TableCore<TData> }]>;
    custom_row_count?: number;
    class?: string;
    pagination_props?: Omit<
      DataTablePaginationProps<TData>,
      "table" | "pagination"
    >;
  }

  interface ComponentState {
    rowSelection: RowSelectionState;
    columnVisibility: VisibilityState;
    columnFilters: ColumnFiltersState;
    sorting: SortingState;
    pagination: PaginationState;
  }
</script>

<script lang="ts" generics="TData, TValue">
  import {
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from "@tanstack/table-core";
  import { DataTablePagination } from ".";
  import { createSvelteTable } from "$/components/ui/data-table/data-table.svelte.js";
  import { FlexRender } from "$/components/ui/data-table";
  import * as Table from "$/components/ui/table/index.js";
  import type { Snippet } from "svelte";
  import type { Table as TableCore } from "@tanstack/table-core";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

  let {
    columns,
    data,
    data_table_toolbar,
    floating_bar,
    custom_row_count = 10,
    class: className = "",
    pagination_props = $bindable<DataTablePaginationProps<TData>>(),
  }: DataTableProps<TData, TValue> = $props();

  let { rowSelection, columnVisibility, columnFilters, sorting, pagination } =
    $derived<ComponentState>({
      rowSelection: {},
      columnVisibility: {},
      columnFilters: [],
      sorting: [],
      pagination: { pageIndex: 0, pageSize: custom_row_count },
    });

  const table = $derived(
    createSvelteTable({
      get data() {
        return data;
      },
      state: {
        get sorting() {
          return sorting;
        },
        get columnVisibility() {
          return columnVisibility;
        },
        get rowSelection() {
          return rowSelection;
        },
        get columnFilters() {
          return columnFilters;
        },
        get pagination() {
          return pagination;
        },
      },
      columns,
      enableRowSelection: true,
      onRowSelectionChange: (updater) => {
        rowSelection =
          typeof updater === "function" ? updater(rowSelection) : updater;
      },
      onSortingChange: (updater) => {
        sorting = typeof updater === "function" ? updater(sorting) : updater;
      },
      onColumnFiltersChange: (updater) => {
        columnFilters =
          typeof updater === "function" ? updater(columnFilters) : updater;
      },
      onColumnVisibilityChange: (updater) => {
        columnVisibility =
          typeof updater === "function" ? updater(columnVisibility) : updater;
      },
      onPaginationChange: (updater) => {
        pagination =
          typeof updater === "function" ? updater(pagination) : updater;
      },
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    }),
  );
</script>

{#if floating_bar && table.getFilteredSelectedRowModel().rows.length > 0}
  {@render floating_bar({ table })}
{/if}

<div
  class={[
    "relative overflow-hidden rounded-md border bg-muted",
    {
      className,
    },
  ]}
>
  {#if data_table_toolbar}
    <div class="border-b p-2">
      {@render data_table_toolbar({ table })}
    </div>
  {/if}

  <!-- Header outside ScrollArea so it stays fixed and matches body width -->
  <Table.Root>
    <Table.Header class="sticky top-0 z-10 border-b">
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head>
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()}
                />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
  </Table.Root>

  <!-- Scrollable body with same table structure -->
  <ScrollArea class="max-h-[calc(100vh-15rem)] overflow-auto">
    <Table.Root>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && "selected"}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell class="whitespace-nowrap">
                <FlexRender
                  content={cell.column.columnDef.cell}
                  context={cell.getContext()}
                />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              No results.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </ScrollArea>

  <DataTablePagination {table} {...pagination_props} />
</div>
