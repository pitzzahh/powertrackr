<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { getLanguageName, lang } from '$lib';
	import { availableLanguageTags, languageTag, setLanguageTag } from '$paraglide/runtime';
	import * as m from '$paraglide/messages';
	import { goto } from '$app/navigation';
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

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	const closeAndFocusTrigger = (triggerId: string, value: string): void => {
		open = false;
		tick().then(async () => {
			document.getElementById(triggerId)?.focus();
			if (value !== languageTag() && value !== m.select_lang()) {
				// @ts-ignore
				setLanguageTag(value);
				$lang = languageTag();
				goto('/').then(() => goto(`user/${data.user?.username}/preferences`));
			}
		});
	};
</script>

<svelte:head>
	<title>{data.user?.name} {m.preferences_route_title()}</title>
</svelte:head>
<h4>{m.preferences()}</h4>
<p
	class="mb-2 text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1"
>
	{m.preferences_desc()}
</p>

<Separator />
<p class="text-md font-medium leading-none">{m.lang()}</p>
<span class=" text-sm text-muted-foreground">{m.choose_lang()}</span>
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
		<Popover.Content class="w-auto p-0">
			<Command.Root>
				<Command.Input placeholder={m.select_lang()} />
				<Command.Empty>{m.no_lang_found()}</Command.Empty>
				<Command.Group class="h-40 overflow-y-auto scrollbar-hide">
					{#each languages as lang}
						<Command.Item
							value={lang.value}
							onSelect={(val) => closeAndFocusTrigger(ids.trigger, val)}
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
