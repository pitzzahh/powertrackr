<script lang="ts">
	import { formatDate } from '$lib';
	import type { PageData } from './$types';
	import DataTable from './data-table.svelte';

	export let data: PageData;

	$: history = data.user?.billing_info.map((bill) => {
		return {
			id: bill.id,
			date: formatDate(new Date(bill.date)),
			totalKwh: bill.totalKwh,
			subKwh: bill.subKwh,
			payPerKwh: bill.payPerKwh,
			balance: bill.balance,
			payment: bill.payment?.amount,
			subPayment: bill.subPayment?.amount,
			status: bill.status
		};
	}) as BillingInfoDTO[];

	$: console.log(`History Data: ${JSON.stringify(history, null, 2)}`)
</script>

<svelte:head>
	<title>PowerTrackr History</title>
</svelte:head>

<div class="container mx-auto">
	<DataTable {history} />
</div>
