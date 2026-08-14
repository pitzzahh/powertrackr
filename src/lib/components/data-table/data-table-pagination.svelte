<script module lang="ts">
  import type { RowData } from "@tanstack/table-core";
  export interface DataTablePaginationProps<TData extends RowData> {
    table: Table<TData>;
    status?: AsyncState;
    hide_show_row_count?: boolean;
  }
</script>

<script lang="ts" generics="TData extends RowData">
  import {
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    Loader,
  } from "#lib/assets/icons.js";
  import type { SvelteTable as Table } from "#lib/components/ui/data-table/index.js";
  import * as Select from "#lib/components/ui/select/index.js";

  import { Button } from "#lib/components/ui/button/index.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { ScrollArea } from "#lib/components/ui/scroll-area/index.js";
  import { cubicInOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import type { Icon } from "@lucide/svelte";
  import type { AsyncState } from "#lib/types/state.js";
  import { usePendingFetch } from "#lib/hooks/use-pending-fetch.svelte.js";

  const pendingFetch = usePendingFetch();

  let { table, status = "idle", hide_show_row_count }: DataTablePaginationProps<TData> = $props();
</script>

<div class="sticky bottom-0 z-10 w-full overflow-hidden rounded-b border bg-card backdrop-blur-sm">
  <ScrollArea orientation="horizontal" class="w-full">
    <div class="flex min-w-max items-center justify-between gap-6 px-4 py-2">
      <!-- Left section: Selection and loading info -->
      <div class="flex items-center gap-4">
        {#if table.getFilteredSelectedRowModel().rows.length > 0}
          <div transition:scale={{ duration: 200, easing: cubicInOut }}>
            <Badge
              variant="secondary"
              class="flex items-center gap-2 text-sm font-medium whitespace-nowrap dark:bg-background"
            >
              <div class="size-2 animate-pulse rounded-full bg-primary"></div>
              {table.getFilteredSelectedRowModel().rows.length} of
              {table.getFilteredRowModel().rows.length} selected
            </Badge>
          </div>
        {/if}
        {#if status === "loading_data" || status === "fetching"}
          <Badge
            variant="secondary"
            class="flex animate-pulse items-center text-sm font-medium whitespace-nowrap dark:bg-background"
          >
            <Loader class="mr-2 h-3.5 w-3.5 animate-spin" />
            {#if status === "loading_data"}
              Crunching initial data...
            {:else}
              Fetching some required data...
            {/if}
          </Badge>
        {/if}
      </div>

      <!-- Right section: Controls -->
      <div class="flex items-center gap-6">
        <!-- Rows per page -->
        {#if !hide_show_row_count}
          <div class="flex items-center gap-3">
            <span class="shrink-0 text-sm font-medium text-muted-foreground">Show</span>
            <Select.Root
              allowDeselect={false}
              type="single"
              value={String(table.atoms.pagination.get().pageSize)}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <Select.Trigger
                class="h-9 w-18.75 border-border/50 bg-background shadow-sm transition-colors hover:border-border"
              >
                <span class="font-medium"
                  >{String(
                    table.atoms.pagination.get().pageSize ==
                      table.getPrePaginatedRowModel().rows.length
                      ? "All"
                      : table.atoms.pagination.get().pageSize
                  )}</span
                >
              </Select.Trigger>
              <Select.Content side="top" class="max-h-md">
                {#each [5, 10, 25, Math.round(table.getRowCount() / 4), Math.round(table.getRowCount() / 2)]
                  .filter((size, i, arr) => size > 0 && arr.indexOf(size) === i)
                  .sort((a, b) => a - b) as pageSize (pageSize)}
                  <Select.Item value={pageSize.toString()} class="font-medium">
                    {pageSize}
                  </Select.Item>
                {/each}
                <Select.Item
                  value={table.getPrePaginatedRowModel().rows.length.toString()}
                  class="font-medium"
                >
                  All
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <span class="shrink-0 text-sm text-muted-foreground">entries</span>
          </div>
        {/if}
        <!-- Page info -->
        <div class="flex shrink-0 items-center gap-2">
          <div class="rounded-md bg-muted/50 px-3 py-1.5">
            <span class="text-sm font-medium">
              Page <span class="font-semibold text-primary"
                >{table.atoms.pagination.get().pageIndex + 1}</span
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
          <div class="mx-2 flex items-center rounded-md bg-muted/30 px-3 py-1.5">
            <span class="text-xs font-medium text-muted-foreground">
              {table.atoms.pagination.get().pageIndex + 1}/{table.getPageCount()}
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
    </div>
  </ScrollArea>
</div>

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
    class="flex h-9 w-9 p-0 transition-all duration-200"
    onclick={() => {
      pendingFetch.reset();
      onclick();
    }}
    {disabled}
  >
    <span class="sr-only">{content}</span>
    <BtnIcon class="h-4 w-4" />
  </Button>
{/snippet}
