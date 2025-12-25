<script module lang="ts">
  import type { DataTablePaginationProps } from "./data-table-pagination.svelte";
  export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    data_table_toolbar?: Snippet<[{ table: TableCore<TData> }]>;
    floating_bar?: Snippet<[{ table: TableCore<TData> }]>;
    custom_row_count?: number;
    class?: string;
    pagination_props?: Omit<DataTablePaginationProps<TData>, "table">;
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
    class: className,
    pagination_props = $bindable<DataTablePaginationProps<TData>>(),
  }: DataTableProps<TData, TValue> = $props();

  let { rowSelection, columnVisibility, columnFilters, sorting, pagination } =
    $state<ComponentState>({
      rowSelection: {},
      columnVisibility: {},
      columnFilters: [],
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    });

  $effect(() => {
    pagination.pageSize = custom_row_count;
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
        if (typeof updater === "function") {
          rowSelection = updater(rowSelection);
        } else {
          rowSelection = updater;
        }
      },
      onSortingChange: (updater) => {
        if (typeof updater === "function") {
          sorting = updater(sorting);
        } else {
          sorting = updater;
        }
      },
      onColumnFiltersChange: (updater) => {
        if (typeof updater === "function") {
          columnFilters = updater(columnFilters);
        } else {
          columnFilters = updater;
        }
      },
      onColumnVisibilityChange: (updater) => {
        if (typeof updater === "function") {
          columnVisibility = updater(columnVisibility);
        } else {
          columnVisibility = updater;
        }
      },
      onPaginationChange: (updater) => {
        if (typeof updater === "function") {
          pagination = updater(pagination);
        } else {
          pagination = updater;
        }
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

{#if data_table_toolbar}
  <ScrollArea class="grid h-auto w-full">
    {@render data_table_toolbar?.({
      table,
    })}
  </ScrollArea>
{/if}

{#if floating_bar && table.getFilteredSelectedRowModel().rows.length > 0}
  {@render floating_bar({ table })}
{/if}

<ScrollArea class={["grid h-full w-full overflow-auto", className]}>
  <div class="rounded-md border overflow-hidden">
    <Table.Root>
      <Table.Header class="sticky top-0 z-10">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
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
      <Table.Body class="h-100 overflow-auto">
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && "selected"}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
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
    <DataTablePagination {table} {...pagination_props} />
  </div>
</ScrollArea>
