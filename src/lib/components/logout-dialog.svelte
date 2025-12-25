<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as m from '$paraglide/messages';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';

	export let open: boolean = false;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	const logout = async () => {
		await invalidateAll();
		goto(`${$page.url.protocol}//${$page.url.host}/user/${$state.user?.username}/logout`);
		$state.user = undefined;
		$state.history = undefined;
	};
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{m.logout_confirmation()}</AlertDialog.Title>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel on:click={() => (open = false)}>{m.cancel()}</AlertDialog.Cancel>
			<AlertDialog.Action on:click={logout} class={cn(buttonVariants({ variant: 'destructive' }))}>{m.logout()}</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
