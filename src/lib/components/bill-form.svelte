<script lang="ts">
	import { page } from '$app/stores';
	import * as Form from '$lib/components/ui/form';
	import { billFormSchema, type BillFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import { Calendar as CalendarIcon } from 'radix-icons-svelte';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		CalendarDate,
		today
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { CustomCalendar } from '$lib/components/ui/custom-calendar';
	import * as Select from '$lib/components/ui/select';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import * as m from '$paraglide/messages';
	import { languageTag } from '$paraglide/runtime';

	export let form: SuperValidated<BillFormSchema> = $page.data.form;
		
	const df = new DateFormatter(languageTag(), {
		dateStyle: 'long'
	});

	const items = [
		{ value: 0, label: m.today() },
		{ value: 1, label: m.tomorrow() },
		{ value: 3, label: m.in_three_days() },
		{ value: 7, label: m.in_a_week() },
		{ value: 30, label: m.in_a_month() }
	];

	const state: Writable<State> = getState(MAIN_STATE_CTX);
	
	let paid = false;
	let placeholder: CalendarDate = today(getLocalTimeZone());
	let subTitle: string[] = m.form_sub_title().split('|');

	const theForm = superForm(form, {
		validators: billFormSchema,
		taintedMessage: null,
		onSubmit() {
			toast.info(m.adding_item({item: m.billing_info()}));
		},
		async onResult({ result }) {
			if (result.status === 200) {
				toast.success(m.item_added_success({item: m.billing_info()}));
				$state.isAddingBill = false;
			}
			if (result.status === 400 || result.status === 500) {
				toast.error(m.invalid_data(), {
					description: m.close_form(),
					action: {
						label: m.close(),
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
	$: status = paid ? subTitle[5] : subTitle[4];
</script>

<Form.Root method="POST" form={theForm} controlled schema={billFormSchema} let:config>
	<Form.Field {config} name="date">
		<Form.Item class="flex flex-col">
			<Form.Label for="date">{subTitle[0]}</Form.Label>
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
						{value ? df.format(value.toDate(getLocalTimeZone())) : m.pick_date()}
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
							{m.calendar_option_label()}
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
						calendarLabel={subTitle[0]}
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
			<Form.Label>{subTitle[1]}</Form.Label>
			<Form.Input />
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="totalKwh">
		<Form.Item>
			<Form.Label>{subTitle[2]}</Form.Label>
			<Form.Input />
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Field {config} name="subReading">
		<Form.Item>
			<Form.Label>{subTitle[3]}</Form.Label>
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
	<Form.Button class="mt-2 w-full">{m.add()}</Form.Button>
</Form.Root>
