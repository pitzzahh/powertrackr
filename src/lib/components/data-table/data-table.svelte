<script module lang="ts">
  import type { DataTablePaginationProps } from "./data-table-pagination.svelte";
  import type {
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    RowData,
    RowSelectionState,
    SortingState,
  } from "@tanstack/table-core";
  import type { SvelteColumnDef, SvelteTable } from "#lib/components/ui/data-table/index.js";
  export interface DataTableProps<TData extends RowData, TValue> {
    columns: SvelteColumnDef<TData, TValue>[];
    data: TData[];
    data_table_toolbar?: Snippet<[{ table: SvelteTable<TData> }]>;
    floating_bar?: Snippet<[{ table: SvelteTable<TData> }]>;
    custom_row_count?: number;
    class?: string;
    status?: AsyncState;
    pagination_props?: Omit<DataTablePaginationProps<TData>, "table" | "pagination">;
  }
</script>

<script lang="ts" generics="TData extends RowData, TValue">
  import { createTableState } from "@tanstack/svelte-table";
  import { DataTablePagination } from ".";
  import {
    createSvelteTable,
    type SvelteTable as TableCore,
  } from "#lib/components/ui/data-table/index.js";
  import { FlexRender } from "#lib/components/ui/data-table/index.js";
  import * as Table from "#lib/components/ui/table/index.js";
  import type { Snippet } from "svelte";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { ScrollArea } from "../ui/scroll-area";
  import type { AsyncState } from "#lib/types/state.js";

  let {
    columns,
    data,
    status,
    data_table_toolbar,
    floating_bar,
    custom_row_count = 10,
    class: className = "",
    pagination_props = $bindable<DataTablePaginationProps<TData>>(),
  }: DataTableProps<TData, TValue> = $props();

  // Controlled state slices owned by this component. `createTableState` is the
  // v9-supported holder: its setter accepts both plain values and TanStack
  // updater functions, and its getter is read through the state getters below
  // so the adapter's `$effect.pre` re-syncs options on every change.
  const [rowSelection, setRowSelection] = createTableState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = createTableState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = createTableState<ColumnFiltersState>([]);
  const [sorting, setSorting] = createTableState<SortingState>([]);
  const [pagination, setPagination] = $derived(
    createTableState<PaginationState>({
      pageIndex: 0,
      pageSize: custom_row_count,
    })
  );

  const table = $derived(
    createSvelteTable<TData>({
      get data() {
        return data;
      },
      state: {
        get sorting() {
          return sorting();
        },
        get columnVisibility() {
          return columnVisibility();
        },
        get rowSelection() {
          return rowSelection();
        },
        get columnFilters() {
          return columnFilters();
        },
        get pagination() {
          return pagination();
        },
      },
      get columns() {
        return columns;
      },
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onPaginationChange: setPagination,
    })
  );
</script>

{#if floating_bar && table.getFilteredSelectedRowModel().rows.length > 0}
  {@render floating_bar({ table })}
{/if}

<div in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }} class="rounded-t border bg-card">
  {#if data_table_toolbar}
    {@render data_table_toolbar({ table })}
  {/if}
</div>
<div in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
  <ScrollArea class="h-full max-h-[calc(100vh-12.25rem)]">
    <div
      class={[
        "h-full overflow-auto bg-muted",
        {
          className,
        },
      ]}
    >
      <Table.Root class="bg-card">
        <Table.Header class="sticky top-0 z-10 border border-b bg-card">
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
        <Table.Body class="border bg-card">
          {#if status === "loading_data"}
            <Table.Row>
              <Table.Cell colspan={columns.length} class="h-24 text-center">
                Loading data...
              </Table.Cell>
            </Table.Row>
          {:else if status === "error"}
            <Table.Row>
              <Table.Cell colspan={columns.length} class="h-24 text-center">
                Error loading data.
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each table.getRowModel().rows as row (row.id)}
              <Table.Row data-state={row.getIsSelected() && "selected"}>
                {#each row.getVisibleCells() as cell (cell.id)}
                  <Table.Cell class="whitespace-nowrap">
                    <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                  </Table.Cell>
                {/each}
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={columns.length} class="h-24 text-center">
                  No matching records. Adjust the filters or add a billing period.
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </div>

    <div in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }} class="mt-2">
      <DataTablePagination {table} {status} {...pagination_props} />
    </div>
  </ScrollArea>
</div>
