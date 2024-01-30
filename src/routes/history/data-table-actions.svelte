<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { BookUser, Copy, MoreHorizontal, Trash, Receipt } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { getState } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';

	export let bill_id: string;

	const state: Writable<State> = getState();

	$: user_id = $state.user?.id;
	$: isDeleting = false;

	async function deleteBill(): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				if (!user_id) reject('Not authenticated');
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
			<span class="sr-only">Open menu</span>
			<MoreHorizontal class="h-4 w-4" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Actions</DropdownMenu.Label>
			<DropdownMenu.Item
				on:click={() => {
					toast.success('Payment ID copied to clipboard', {
						description: new Date().toLocaleDateString('en-us', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							timeZone: 'UTC',
							timeZoneName: 'short'
						}),
						action: {
							label: 'Undo',
							onClick: () => {
								navigator.clipboard.writeText('');
								console.log('Undo');
							}
						}
					});
					navigator.clipboard.writeText(bill_id);
				}}
			>
				<Copy class="mr-2 h-4 w-4" />
				Copy payment ID
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={() => (isDeleting = true)} class="data-[highlighted]:bg-red-600">
			<Trash class="mr-2 h-4 w-4" />
			Delete Bill
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => goto(`testUser`)}>
			<BookUser class="mr-2 h-4 w-4" />
			View customer</DropdownMenu.Item
		>
		<DropdownMenu.Item on:click={() => goto(`history/${bill_id}`)}>
			<Receipt class="mr-2 h-4 w-4" />
			View payment details</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<AlertDialog.Root bind:open={isDeleting}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Confirmation</AlertDialog.Title>
			<AlertDialog.Description>Are you sure you want to delete this bill?</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class={cn(buttonVariants({ variant: 'destructive' }))}
				on:click={() => {
					toast.promise(deleteBill, {
						loading: `Deleting bill`,
						success: (res) => {
							return `${res}`;
						},
						error: (err) => {
							return `${err}`;
						}
					});
				}}
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
