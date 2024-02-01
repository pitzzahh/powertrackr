<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { i18n } from '$lib/i18n.js'
	import { page } from '$app/stores'
	import { availableLanguageTags, languageTag } from '../../../../paraglide/runtime';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.user?.name} preference settings</title>
</svelte:head>

<h4>Preferences</h4>
<p
	class="text-sm text-muted-foreground sm:mb-6 [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1"
>
	Customize the app based on your preferences such as themes etc.
</p>

<Separator class="my-4" />
{#each availableLanguageTags as lang}
	<a 
		href={i18n.route($page.url.pathname)}
		hreflang={lang}
		aria-current={lang === languageTag() ? "page" : undefined}
	>
		{lang}
	</a>
{/each}