<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronRight, ChevronLeft, DoubleArrowRight, DoubleArrowLeft } from 'radix-icons-svelte';
	import * as Select from '$lib/components/ui/select';
	import type { BillingInfoDTO } from '$lib/types';
	import type { TableViewModel } from 'svelte-headless-table';
	import type { AnyPlugins } from 'svelte-headless-table/plugins';
	import {
		num_rows_selected,
		item_per_page,
		current_page,
		rows_only,
		select_item_size,
		page_only,
		goto_item_page,
		first_only,
		last_only,
		next_only,
		previous_only
	} from '$paraglide/messages';

	export let tableModel: TableViewModel<BillingInfoDTO, AnyPlugins>;

	const { pageRows, pluginStates, rows } = tableModel;

	const { hasNextPage, hasPreviousPage, pageIndex, pageCount, pageSize } = pluginStates.page;

	const { selectedDataIds } = pluginStates.select;
</script>

<!-- TODO: Fix style on mobile, use scrollbar-hide to and overflow-auto to make it horizontally scrollable -->
<div class="mt-1 flex items-center justify-between overflow-auto scrollbar-hide">
	<span class="w-full flex-nowrap text-sm text-muted-foreground">
		{num_rows_selected({
			from: Object.keys($selectedDataIds).length,
			to: $rows.length
		})}
	</span>
	<div class="flex items-center justify-end gap-1">
		<div class="flex items-center space-x-2">
			<p class=" text-sm font-medium">{item_per_page({ item: rows_only() })}</p>
			<Select.Root
				onSelectedChange={(selected) => pageSize.set(Number(selected?.value))}
				selected={{ value: 10, label: '10' }}
			>
				<Select.Trigger>
					<Select.Value placeholder={select_item_size({ item: page_only() })} />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="10">10</Select.Item>
					<Select.Item value="20">20</Select.Item>
					<Select.Item value="30">30</Select.Item>
					<Select.Item value="40">40</Select.Item>
					<Select.Item value="50">50</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex w-[100px] items-center justify-center text-sm font-medium">
			{current_page({ from: $pageIndex + 1, to: $pageCount })}
		</div>
		<div class="flex items-center space-x-2">
			<Button
				variant="outline"
				class="hidden h-8 w-8 p-0 lg:flex"
				on:click={() => ($pageIndex = 0)}
				disabled={!$hasPreviousPage}
			>
				<span class="sr-only">{goto_item_page({ item: first_only() })}</span>
				<DoubleArrowLeft size={15} />
			</Button>
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				on:click={() => ($pageIndex = $pageIndex - 1)}
				disabled={!$hasPreviousPage}
			>
				<span class="sr-only">{goto_item_page({ item: previous_only() })}</span>
				<ChevronLeft size={15} />
			</Button>
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				disabled={!$hasNextPage}
				on:click={() => ($pageIndex = $pageIndex + 1)}
			>
				<span class="sr-only">{goto_item_page({ item: next_only() })}</span>
				<ChevronRight size={15} />
			</Button>
			<Button
				variant="outline"
				class="hidden h-8 w-8 p-0 lg:flex"
				disabled={!$hasNextPage}
				on:click={() => ($pageIndex = Math.ceil($rows.length / $pageRows.length) - 1)}
			>
				<span class="sr-only">{goto_item_page({ item: last_only() })}</span>
				<DoubleArrowRight size={15} />
			</Button>
		</div>
	</div>
</div>
