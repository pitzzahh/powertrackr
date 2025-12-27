<script module lang="ts">
    export interface DataTablePaginationProps<TData> {
        table: Table<TData>;
        fetching?: boolean;
        hide_show_row_count?: boolean;
    }
</script>

<script lang="ts" generics="TData">
    import {
        ChevronRight,
        ChevronLeft,
        ChevronsRight,
        ChevronsLeft,
        Loader,
    } from "$/assets/icons";
    import type { Table } from "@tanstack/table-core";
    import * as Select from "$/components/ui/select/index.js";
    import { ScrollArea } from "$/components//ui/scroll-area";
    import { Button } from "$/components/ui/button/index.js";
    import { Badge } from "$/components/ui/badge/index.js";
    import { cubicInOut } from "svelte/easing";
    import { scale } from "svelte/transition";
    import type { Icon } from "@lucide/svelte";

    let {
        table,
        fetching = $bindable(false),
        hide_show_row_count,
    }: DataTablePaginationProps<TData> = $props();
</script>

<ScrollArea orientation="horizontal" class="w-full sticky-0 bottom-0 z-10">
    <div
        class="flex items-center justify-between gap-6 px-4 py-2 bg-card rounded-b backdrop-blur-sm"
    >
        <!-- Left section: Selection and loading info -->
        <div class="flex items-center gap-4">
            {#if table.getFilteredSelectedRowModel().rows.length > 0}
                <div transition:scale={{ duration: 200, easing: cubicInOut }}>
                    <Badge
                        variant="secondary"
                        class="flex items-center dark:bg-background gap-2 text-sm font-medium whitespace-nowrap"
                    >
                        <div
                            class="size-2 bg-primary rounded-full animate-pulse"
                        ></div>
                        {table.getFilteredSelectedRowModel().rows.length} of
                        {table.getFilteredRowModel().rows.length} selected
                    </Badge>
                </div>
            {/if}
            {#if fetching}
                <Badge
                    variant="secondary"
                    class="whitespace-nowrap animate-pulse"
                >
                    <Loader class="mr-2 h-3.5 w-3.5 animate-spin" />
                    Loading...
                </Badge>
            {/if}
        </div>
    </div>

    <!-- Right section: Controls -->
    <div class="flex items-center gap-6">
        <!-- Rows per page -->
        {#if !hide_show_row_count}
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-muted-foreground shrink-0"
                    >Show</span
                >
                <Select.Root
                    allowDeselect={false}
                    type="single"
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => {
                        table.setPageSize(Number(value));
                    }}
                >
                    <Select.Trigger
                        class="h-9 w-18.75 bg-background border-border/50 hover:border-border transition-colors shadow-sm"
                    >
                        <span class="font-medium"
                            >{String(
                                table.getState().pagination.pageSize ==
                                    table.getPrePaginationRowModel().rows.length
                                    ? "All"
                                    : table.getState().pagination.pageSize,
                            )}</span
                        >
                    </Select.Trigger>
                    <Select.Content side="top" class="max-h-md">
                        {#each [5, 10, 25, Math.round(table.getRowCount() / 4), Math.round(table.getRowCount() / 2)]
                            .filter((size, i, arr) => size > 0 && arr.indexOf(size) === i)
                            .sort((a, b) => a - b) as pageSize (pageSize)}
                            <Select.Item
                                value={pageSize.toString()}
                                class="font-medium"
                            >
                                {pageSize}
                            </Select.Item>
                        {/each}
                        <Select.Item
                            value={table
                                .getPrePaginationRowModel()
                                .rows.length.toString()}
                            class="font-medium"
                        >
                            All
                        </Select.Item>
                    </Select.Content>
                </Select.Root>
                <span class="text-sm text-muted-foreground shrink-0"
                    >entries</span
                >
            </div>
        {/if}
        <!-- Page info -->
        <div class="hidden sm:flex items-center gap-2">
            <div class="px-3 py-1.5 bg-muted/50 rounded-md">
                <span class="text-sm font-medium">
                    Page <span class="text-primary font-semibold"
                        >{table.getState().pagination.pageIndex + 1}</span
                    >
                    of
                    <span class="font-semibold">{table.getPageCount()}</span>
                </span>
            </div>
        </div>

        <!-- Navigation buttons -->
        <div class="flex items-center gap-1">
            {@render pagination_buttons({
                onclick: () => table.setPageIndex(0),
                disabled: !table.getCanPreviousPage(),
                content: "First page",
                BtnIcon: ChevronsLeft,
            })}

            {@render pagination_buttons({
                onclick: () => table.previousPage(),
                disabled: !table.getCanPreviousPage(),
                content: "Previous page",
                BtnIcon: ChevronLeft,
            })}

            <!-- Mobile page indicator -->
            <div
                class="sm:hidden flex items-center px-3 py-1.5 bg-muted/30 rounded-md mx-2"
            >
                <span class="text-xs font-medium text-muted-foreground">
                    {table.getState().pagination.pageIndex +
                        1}/{table.getPageCount()}
                </span>
            </div>

            {@render pagination_buttons({
                onclick: () => table.nextPage(),
                disabled: !table.getCanNextPage(),
                content: "Next page",
                BtnIcon: ChevronRight,
            })}

            {@render pagination_buttons({
                onclick: () => table.setPageIndex(table.getPageCount() - 1),
                disabled: !table.getCanNextPage(),
                content: "Last page",
                BtnIcon: ChevronsRight,
            })}
        </div>
    </div>
</ScrollArea>

{#snippet pagination_buttons({
    onclick,
    disabled,
    content,
    BtnIcon,
}: {
    onclick: () => void;
    disabled: boolean;
    content: string;
    BtnIcon: typeof Icon;
})}
    <Button
        variant="ghost"
        size="icon"
        class="hidden lg:flex h-9 w-9 p-0 transition-all duration-200"
        {onclick}
        {disabled}
    >
        <span class="sr-only">{content}</span>
        <BtnIcon class="h-4 w-4" />
    </Button>
{/snippet}
