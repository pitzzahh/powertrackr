<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';

	export let open: boolean = false;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	const logout = async () => {
		await invalidateAll();
		goto(`${$page.url.protocol}//${$page.url.host}/user/${$state.user?.username}/logout`);
		$state.user = undefined;
		$state.history = undefined;
	};

	onMount(() => {
		console.log(`Logout model mounted`);
	});

	onDestroy(() => {
		console.log(`Logout model unmounted`);
	});

	$: console.log(`Logout model open: ${open}`);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure you want to logout?</AlertDialog.Title>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel on:click={() => (open = false)}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action on:click={logout}>Logout</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
