<script lang="ts">
	import DataTable from './data-table.svelte';
	import type { PageData } from './$types';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	$: {
		$state.user = data.user;
		$state.history = data.history;
	}
</script>

<svelte:head>
	<title>PowerTrackr History</title>
</svelte:head>

<div class="container mx-auto">
	<DataTable />
</div>
