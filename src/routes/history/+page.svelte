<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from './data-table.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>History</title>
</svelte:head>

<div class="container mx-auto">
	<DataTable history={data.history}/>
</div>
