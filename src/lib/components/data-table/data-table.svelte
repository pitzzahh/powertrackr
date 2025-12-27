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
    import { scale } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import { ScrollArea } from "../ui/scroll-area";

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
            pagination: { pageIndex: 0, pageSize: 10 },
        });

    const table = createSvelteTable({
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
        get columns() {
            return columns;
        },
        get rowCount() {
            return custom_row_count;
        },
        enableRowSelection: true,
        onRowSelectionChange: (updater) => {
            rowSelection =
                typeof updater === "function" ? updater(rowSelection) : updater;
        },
        onSortingChange: (updater) => {
            sorting =
                typeof updater === "function" ? updater(sorting) : updater;
        },
        onColumnFiltersChange: (updater) => {
            columnFilters =
                typeof updater === "function"
                    ? updater(columnFilters)
                    : updater;
        },
        onColumnVisibilityChange: (updater) => {
            columnVisibility =
                typeof updater === "function"
                    ? updater(columnVisibility)
                    : updater;
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
    });
</script>

{#if floating_bar && table.getFilteredSelectedRowModel().rows.length > 0}
    {@render floating_bar({ table })}
{/if}

<div
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="bg-muted rounded-t"
>
    {#if data_table_toolbar}
        {@render data_table_toolbar({ table })}
    {/if}
</div>
<div in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
    <ScrollArea class="max-h-[calc(100vh-12.25rem)] h-full">
        <div
            class={[
                "overflow-auto bg-muted h-full",
                {
                    className,
                },
            ]}
        >
            <Table.Root>
                <Table.Header class="sticky top-0 z-10 border-b">
                    {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
                        <Table.Row>
                            {#each headerGroup.headers as header (header.id)}
                                <Table.Head>
                                    {#if !header.isPlaceholder}
                                        <FlexRender
                                            content={header.column.columnDef
                                                .header}
                                            context={header.getContext()}
                                        />
                                    {/if}
                                </Table.Head>
                            {/each}
                        </Table.Row>
                    {/each}
                </Table.Header>
                <Table.Body>
                    {#each table.getRowModel().rows as row (row.id)}
                        <Table.Row
                            data-state={row.getIsSelected() && "selected"}
                        >
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
                            <Table.Cell
                                colspan={columns.length}
                                class="h-24 text-center"
                            >
                                No results.
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </div>
    </ScrollArea>
</div>
<div in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
    <DataTablePagination {table} {...pagination_props} />
</div>
