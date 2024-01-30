<script lang="ts">
	import { page } from '$app/stores';
	import * as Form from '$lib/components/ui/form';
	import { billFormSchema, type BillFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import { getState } from '$lib/state';
	import { Calendar as CalendarIcon } from 'radix-icons-svelte';
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		CalendarDate,
		today
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CustomCalendar } from '$lib/components/ui/custom-calendar';
	import * as Select from '$lib/components/ui/select';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { invalidateAll } from '$app/navigation';

	export let form: SuperValidated<BillFormSchema> = $page.data.form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	const items = [
		{ value: 0, label: 'Today' },
		{ value: 1, label: 'Tomorrow' },
		{ value: 3, label: 'In 3 days' },
		{ value: 7, label: 'In a week' },
		{ value: 30, label: 'In a month' }
	];

	const state = getState();
	
	let paid = false;
	let placeholder: CalendarDate = today(getLocalTimeZone());

	const theForm = superForm(form, {
		validators: billFormSchema,
		taintedMessage: null,
		onSubmit() {
			toast.info('Adding billing info...');
		},
		async onResult({ result }) {
			console.log(JSON.stringify(result));
			if (result.status === 200) {
				toast.success('Billing info added successfully!');
				$state.isAddingBill = false;
				await invalidateAll()
			}
			if (result.status === 400 || result.status === 500) {
				toast.error('Please enter valid data', {
					description: 'Close form?',
					action: {
						label: 'Close',
						onClick: () => {
							$state.isAddingBill = false;
						}
					}
				});
			}
		}
	});

	const { form: formStore } = theForm;

	$: value = $formStore.date ? parseDate($formStore.date) : undefined;
	$: status = paid ? 'Paid' : 'Pending';
</script>

<Form.Root method="POST" form={theForm} controlled schema={billFormSchema} let:config>
	<Form.Field {config} name="date">
		<Form.Item class="flex flex-col">
			<Form.Label for="date">Date of Bill</Form.Label>
			<Popover.Root>
				<Form.Control id="date" let:attrs>
					<Popover.Trigger
						id="date"
						{...attrs}
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'justify-start pl-3 text-left font-normal',
							!value && 'text-muted-foreground'
						)}
					>
						{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
						<CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
					</Popover.Trigger>
				</Form.Control>
				<Popover.Content class="w-auto p-0" side="top">
					<Select.Root
						{items}
						onSelectedChange={(v) => {
							if (!v) return;
							value =
								v.value === 0
									? today(getLocalTimeZone())
									: value
										? value.add({ days: v.value })
										: placeholder;
							$formStore.date = value.toString();
						}}
					>
						<Select.Trigger>
							<Select.Value placeholder="Select calendar options" />
						</Select.Trigger>
						<Select.Content>
							{#each items as item}
								<Select.Item bind:value={item.value}>{item.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<CustomCalendar
						bind:value
						bind:placeholder
						minValue={new CalendarDate(1900, 1, 1)}
						maxValue={today(getLocalTimeZone())}
						calendarLabel="Date of Bill"
						initialFocus
						onValueChange={(v) => {
							if (v) {
								$formStore.date = v.toString();
							} else {
								$formStore.date = '';
							}
						}}
					/>
				</Popover.Content>
			</Popover.Root>
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="balance">
		<Form.Item>
			<Form.Label>Balance</Form.Label>
			<Form.Input />
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="totalKwh">
		<Form.Item>
			<Form.Label>Total Kwh</Form.Label>
			<Form.Input />
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="subReading">
		<Form.Item>
			<Form.Label>Sub Meter Reading</Form.Label>
			<Form.Input />
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="status">
		<Form.Item class="flex flex-row items-center justify-between rounded-lg border p-2">
			<Form.Label>{status}</Form.Label>
			<Form.Switch onCheckedChange={(e) => (paid = e)} />
		</Form.Item>
	</Form.Field>
	<Form.Button class="mt-2 w-full">Add</Form.Button>
</Form.Root>
