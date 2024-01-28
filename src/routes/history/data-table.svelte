<script lang="ts">
	import { store, filteredDataFields } from '$lib';
	import {
		addPagination,
		addSortBy,
		addTableFilter,
		addHiddenColumns,
		addSelectedRows
	} from 'svelte-headless-table/plugins';
	import { createTable, Render, Subscribe, createRender } from 'svelte-headless-table';
	import { readable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import DataTableActions from './data-table-actions.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpDown, ChevronDown } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import DataTableComboBox from './data-table-combobox.svelte';

	export let history: BillingInfoDTO[];

	const table = createTable(readable(history), {
		page: addPagination(),
		sort: addSortBy({ disableMultiSort: true }),
		filter: addTableFilter({
			fn: ({ filterValue, value }: { filterValue: string; value: string }) => {
				return (
					value.toLowerCase().includes(filterValue.toLowerCase()) ||
					value.toLowerCase() === filterValue.toLowerCase()
				);
			}
		}),
		hide: addHiddenColumns(),
		select: addSelectedRows()
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: (_: any, { pluginStates }: any) => {
				const { allPageRowsSelected } = pluginStates.select;
				return createRender(DataTableCheckbox, {
					checked: allPageRowsSelected
				});
			},
			cell: ({ row }: { row: any }, { pluginStates }: { pluginStates: any }) => {
				const { getRowState } = pluginStates.select;
				const { isSelected } = getRowState(row);

				return createRender(DataTableCheckbox, {
					checked: isSelected
				});
			},
			plugins: {
				sort: {
					disable: true
				},
				filter: {
					exclude: true
				}
			}
		}),
		table.column({
			accessor: 'date',
			header: 'Date',
			cell: ({ value }: { value: string }) => value,
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'totalKwh',
			header: 'Total kwh',
			cell: ({ value }: { value: number }) => {
				return `${value} kwh`;
			},
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'subKwh',
			header: 'Sub Kwh',
			cell: ({ value }: { value: number }) => {
				return value ? `${value} kwh` : 'N/A';
			},
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'balance',
			header: 'Balance',
			cell: ({ value }: { value: number }) => {
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'PHP'
				}).format(value);
			},
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'payment',
			header: 'Payment',
			cell: ({ value }: { value: number }) => {
				return value
					? new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'PHP'
						}).format(value)
					: 'N/A';
			},
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'subPayment',
			header: 'SubPayment',
			cell: ({ value }: { value: number }) => {
				return value
					? new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'PHP'
						}).format(value)
					: 'N/A';
			},
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: 'status',
			header: 'Status',
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: false
				}
			}
		}),
		table.column({
			accessor: ({ id }: { id: string }) => id,
			header: '',
			cell: ({ value }: { value: string }) => {
				return createRender(DataTableActions, { id: value });
			},
			plugins: {
				sort: {
					disable: true
				}
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } =
		table.createViewModel(columns);

	const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;

	const ids = flatColumns.map((col: { id: string }) => col.id);
	let hideForId = Object.fromEntries(ids.map((id: string) => [id, true]));

	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);
</script>

<div>
	<div class="flex items-center py-4">
		<div class="flex items-center gap-1">
			<Input
				placeholder={`Filter ${$store.filteredField ? `by ${$store.filteredField}` : `bills`}`}
				type="text"
				bind:value={$filterValue}
			/>
			<DataTableComboBox disabled={true} />
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" class="ml-auto" builders={[builder]}>
					Columns <ChevronDown class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each flatColumns as col}
					{#if filteredDataFields.includes(col.id)}
						<DropdownMenu.CheckboxItem bind:checked={hideForId[col.id]}>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Caption
				>{history.length > 0 ? 'A list of your invoices.' : 'No invoices'}</Table.Caption
			>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
									<Table.Head {...attrs} class="px-0 font-bold [&:has([role=checkbox])]:pl-4">
										{#if cell.label === '' || cell.id === 'id'}
											<Render of={cell.render()} />
										{:else}
											<Button variant="ghost" on:click={props.sort.toggle} class="font-bold">
												<Render of={cell.render()} />
												<ArrowUpDown class={'ml-2 h-4 w-4'} />
											</Button>
										{/if}
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row {...rowAttrs} data-state={$selectedDataIds[row.id] && 'selected'}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										<Render of={cell.render()} />
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-2 py-4">
		<div class="flex-1 text-sm text-muted-foreground">
			{Object.keys($selectedDataIds).length} of{' '}
			{$rows.length} row(s) selected.
		</div>
		<Button
			variant="outline"
			size="sm"
			on:click={() => ($pageIndex = $pageIndex - 1)}
			disabled={!$hasPreviousPage}>Previous</Button
		>
		<Button
			variant="outline"
			size="sm"
			disabled={!$hasNextPage}
			on:click={() => ($pageIndex = $pageIndex + 1)}>Next</Button
		>
	</div>
</div>
