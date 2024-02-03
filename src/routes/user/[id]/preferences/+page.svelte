<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { lang } from '$lib';
	import { availableLanguageTags, languageTag, setLanguageTag } from '$paraglide/runtime';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as m from '$paraglide/messages';

	export let data: PageData;
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
<div class="mt-2 flex gap-2">
	<RadioGroup.Root
		value={languageTag()}
		class="grid grid-cols-3 gap-4"
		onValueChange={(val) => {
			// @ts-ignore
			setLanguageTag(val);
			$lang = languageTag();
		}}
		data-sveltekit-reload
	>
		{#each availableLanguageTags as lang}
			<Label
				for={lang}
				class="rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
			>
				<RadioGroup.Item value={lang} id={lang} class="sr-only" aria-label={lang} />
				{lang}
			</Label>
		{/each}
	</RadioGroup.Root>
</div>
