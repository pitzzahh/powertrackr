<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { BookUser, Copy, MoreHorizontal, Trash, Receipt } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	export let id: string;

	$: isDeleting = false;
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
					navigator.clipboard.writeText(id);
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
		<DropdownMenu.Item on:click={() => goto(`history/${id}`)}>
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
			<AlertDialog.Action asChild let:builder>
				<Button variant="destructive" builders={[builder]} on:click={() => (isDeleting = false)}>
					Delete
				</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
