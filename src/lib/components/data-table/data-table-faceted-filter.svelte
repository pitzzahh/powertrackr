<script lang="ts" module>
  export type DataTableFacetedFilterProps<TData, TValue, FilterType> = {
    column: Column<TData, TValue>;
    title: string;
    options: FilterOption<FilterType>[];
  };
</script>

<script lang="ts" generics="TData, TValue, FilterType = string">
  import { CirclePlus, Check } from "$/assets/icons";
  import type { Column } from "@tanstack/table-core";
  import { SvelteSet } from "svelte/reactivity";
  import * as Command from "$/components/ui/command/index.js";
  import * as Popover from "$/components/ui/popover/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style";
  import { Separator } from "$/components/ui/separator/index.js";
  import { Badge } from "$/components/ui/badge/index.js";
  import type { FilterOption } from "$/types/filter";

  let {
    column,
    title,
    options,
  }: DataTableFacetedFilterProps<TData, TValue, FilterType> = $props();
  const { facets, selectedValues } = $derived({
    facets: column?.getFacetedUniqueValues(),
    selectedValues: new SvelteSet(
      (column?.getFilterValue() as FilterType[]) || [],
    ),
  });
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="sm" class="h-8 border-dashed">
        <CirclePlus />
        {title}
        {#if options.some((opt) => selectedValues.has(opt.value))}
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {selectedValues.size}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            {#if selectedValues.size > 5}
              <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                {selectedValues.size} selected
              </Badge>
            {:else}
              {#each options.filter( (opt) => selectedValues.has(opt.value), ) as option (option.label)}
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {option.label}
                </Badge>
              {/each}
            {/if}
          </div>
        {/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <Command.Root>
      <Command.Input placeholder="Search {title}" />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {#each options as option (option.label)}
            {@const isSelected = selectedValues.has(option.value)}
            <Command.Item
              onSelect={() => {
                if (isSelected) {
                  selectedValues.delete(option.value);
                } else {
                  selectedValues.add(option.value);
                }
                const filterValues = Array.from(selectedValues);
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined,
                );
              }}
            >
              <div
                class={cn(
                  "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible",
                )}
              >
                <Check class="size-4" />
              </div>
              {#if option.icon}
                {@const Icon = option.icon}
                <Icon class="text-muted-foreground" />
              {/if}

              <span>{option.label}</span>
              {#if facets?.get(option.value)}
                <span
                  class="ml-auto flex size-4 items-center justify-center font-mono text-xs"
                >
                  {Number(facets.get(option.value))}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
      {#if selectedValues.size > 0}
        <Command.Separator />
        <Command.Group>
          <Command.Item
            onSelect={() => column?.setFilterValue(undefined)}
            class="justify-center text-center"
          >
            Clear filters
          </Command.Item>
        </Command.Group>
      {/if}
    </Command.Root>
  </Popover.Content>
</Popover.Root>
