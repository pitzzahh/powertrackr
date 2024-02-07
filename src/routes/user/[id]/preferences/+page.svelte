<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { getLanguageName, lang } from '$lib';
	import { availableLanguageTags, languageTag, setLanguageTag } from '$paraglide/runtime';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as m from '$paraglide/messages';
	import { goto } from '$app/navigation';
	import * as Select from '$lib/components/ui/select';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';

	export let data: PageData;

	const languages = availableLanguageTags
		.map((lang) => {
			return {
				label: getLanguageName(lang)!,
				value: lang
			};
		})
		.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

	let open = false;
	let value = '';
	$: selectedValue = languages.find((lang) => lang.value === value) ?? 'Select a language...';

	$: {
		if (selectedValue !== 'Select a language...') {
			console.log(`Selected language: ${selectedValue}`);
			// @ts-ignore
			setLanguageTag(selectedValue.value);
			$lang = languageTag();
			goto('/').then(() => goto(`user/${data.user?.username}/preferences`));
		}
	}
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	const closeAndFocusTrigger = (triggerId: string): void => {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	};
</script>

<svelte:head>
	<title>{data.user?.name} preference settings</title>
</svelte:head>

<h4>{m.preferences()}</h4>
<p
	class="mb-2 text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1"
>
	{m.preferences_desc()}
</p>

<Separator />
<p class="text-md font-medium leading-none">Language</p>
<span class=" text-sm text-muted-foreground">Choose your preferred language</span>
<div class="mt-2">
	<Popover.Root bind:open let:ids>
		<Popover.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-1/2 justify-between"
			>
				{getLanguageName(languageTag())}
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-1/2 p-0">
			<Command.Root>
				<Command.Input placeholder="Search Language..." />
				<Command.Empty>No language found.</Command.Empty>
				<Command.Group>
					{#each languages as lang}
						<Command.Item
							value={lang.value}
							onSelect={(currentValue) => {
								value = currentValue;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							<Check
								class={cn('mr-2 h-4 w-4', languageTag() !== lang.value && 'text-transparent')}
							/>
							{lang.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
