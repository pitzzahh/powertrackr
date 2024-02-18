<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { BookUser, Copy, MoreHorizontal, Trash, Receipt } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import { languageTag } from '$paraglide/runtime';
	import * as m from '$paraglide/messages';

	export let bill_id: string;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	$: user_id = $state.user?.id;
	$: isDeleting = false;

	async function deleteBill(): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				if (!user_id) reject(m.no_action_permission());
				isDeleting = true;
				const response: Response = await fetch('/history', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ bill_id, user_id })
				});
				const res = await response.json();
				if (response.ok) {
					resolve(res.message);
					await invalidateAll();
					await goto('/');
					goto('/history');
				} else {
					reject(res.message);
				}
			} catch (error: any) {
				toast.error(error.message);
				reject(error.message);
			}
			isDeleting = false;
		});
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button variant="ghost" builders={[builder]} size="icon" class="relative h-8 w-8 p-0">
			<span class="sr-only">{m.open({ item: m.menu() })}</span>
			<MoreHorizontal class="h-4 w-4" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>{m.actions()}</DropdownMenu.Label>
			<DropdownMenu.Item
				on:click={() => {
					toast.success(m.item_copied_to_clipboard({ item: m.payment_id() }), {
						description: new Date().toLocaleDateString(languageTag(), {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							timeZone: 'UTC',
							timeZoneName: 'short'
						}),
						action: {
							label: m.undo(),
							onClick: () => {
								navigator.clipboard.writeText('');
							}
						}
					});
					navigator.clipboard.writeText(bill_id);
				}}
			>
				<Copy class="mr-2 h-4 w-4" />
				{m.copy_item({ item: m.payment_id() })}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={() => (isDeleting = true)} class="data-[highlighted]:bg-red-600">
			<Trash class="mr-2 h-4 w-4" />
			{m.delete_item({ item: m.bill() })}
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => goto(`history/${bill_id}`)}>
			<Receipt class="mr-2 h-4 w-4" />
			{m.view_item_details({ item: m.payment() })}</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<AlertDialog.Root bind:open={isDeleting}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{m.confirmation()}</AlertDialog.Title>
			<AlertDialog.Description>{m.delete_confirmation({ item: m.bill() })}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{m.cancel()}</AlertDialog.Cancel>
			<AlertDialog.Action
				class={cn(buttonVariants({ variant: 'destructive' }))}
				on:click={() => {
					toast.promise(deleteBill, {
						loading: m.deleting_item({ item: m.bill() }),
						success: (res) => {
							return `${res}`;
						},
						error: (err) => {
							return `${err}`;
						}
					});
				}}
			>
				{m.delete_only()}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
