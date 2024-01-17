<script lang="ts">
	import { SlidersHorizontal } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { filteredDataFields, store } from '$lib';
	import { onDestroy, tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	export let disabled: boolean = false;

	let open = false;
	let value = '';

	$: selectedData = filteredDataFields.find((s) => s === value) ?? null;

	$: {
		if (selectedData) {
			$store.filteredField = selectedData;
		}
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	onDestroy(() => {
		selectedData = null;
	});
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" size="sm" {disabled}>
			<SlidersHorizontal />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0" side="right" align="start">
		<Command.Root>
			<Command.Input placeholder="Search filter..." />
			<Command.List>
				<Command.Empty>No results found</Command.Empty>
				<Command.Group>
					{#each filteredDataFields as data}
						<Command.Item
							value={data}
							onSelect={(currentValue) => {
								value = currentValue;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							{data}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
