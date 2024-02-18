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
	import DataTablePagination from './data-table-pagination.svelte';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State, BillingInfoDTO } from '$lib/types';
	import { format, formatDate, PeriodType } from 'svelte-ux';
	import * as m from '$paraglide/messages';

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	let history: BillingInfoDTO[] =
		$state.history && $state.history.length > 0
			? ($state.history?.map((bill) => {
					return {
						id: bill.id,
						date: formatDate(bill.date, PeriodType.Day),
						totalKwh: bill.totalKwh,
						subKwh: bill.subKwh,
						payPerKwh: bill.payPerKwh,
						balance: bill.balance,
						payment: bill.payment?.amount,
						subPayment: bill.subPayment?.amount,
						status: bill.status
					};
				}) as BillingInfoDTO[])
			: [];

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
			header: m.date_only(),
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
			header: m.total_kwh(),
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
			header: m.sub_kwh(),
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
			header: m.balance(),
			cell: ({ value }: { value: number }) => format(value, 'currency'),
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
			header: m.payment(),
			cell: ({ value }: { value: number }) => (value ? format(value, 'currency') : 'N/A'),
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
			header: m.sub_payment(),
			cell: ({ value }: { value: number }) => (value ? format(value, 'currency') : 'N/A'),
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
			header: m.status(),
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
				return createRender(DataTableActions, { bill_id: value });
			},
			plugins: {
				sort: {
					disable: true
				}
			}
		})
	]);

	const tableModel =
		table.createViewModel(columns);

		const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } = tableModel;

	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;

	const ids = flatColumns.map((col: { id: string }) => col.id);

	$: hideForId = Object.fromEntries(ids.map((id: string) => [id, true]));
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
			<Table.Caption
				>{history.length > 0 ? 'A list of your invoices.' : 'No invoices'}</Table.Caption
			>
		</Table.Root>
	</div>
	<DataTablePagination {tableModel} />
</div>
