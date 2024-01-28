<script lang="ts">
	import type { PageData } from '../../routes/$types';
	import type { BillingInfo } from '@prisma/client';
	import { generateSampleData } from '$lib';
	import { onMount } from 'svelte';
	import * as Form from '$lib/components/ui/form';
	import { billFormSchema, type BillFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';
	import { getState } from '$lib/state';

	export let data: PageData;

	const state = getState();
	let paid = false;

	const options: FormOptions<BillFormSchema> = {
		onSubmit() {
			toast.info('Adding billing info...');
		},
		onResult({ result }) {
			console.log(JSON.stringify(result));
			if (result.status === 200) {
				toast.success('Billing info added successfully!');
				$state.isAddingBill = false;
			}
			if (result.status === 400 || result.status === 500) {
				{
					toast.error(result.data?.message || 'Please enter valid data', {
						description: new Date().toLocaleDateString('en-us', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							timeZone: 'UTC',
							timeZoneName: 'short'
						})
					});
				}
			}
		}
	};

	$: balanceHistory = data.user
		? data.user.billing_info?.length > 0
			? data.user?.billing_info.map((billing: BillingInfo) => ({
					date: new Date(billing.date),
					value: billing.balance
				}))
			: generateSampleData(Math.random() * 100 + 1)
		: [];

	$: show = false;
	$: noData = false;

	$: status = paid ? 'Paid' : 'Pending';

	onMount(() => {
		setTimeout(() => {
			show = (balanceHistory?.length ?? 0) !== 0;
			noData = !show;
		}, 1000);
	});
</script>

<div class="h-1/2 scrollbar-hide">
	<Form.Root method="POST" form={data.form} {options} schema={billFormSchema} let:config>
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
</div>
