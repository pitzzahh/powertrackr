<script lang="ts">
	import '../app.pcss';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/header.svelte';
	import { onNavigate } from '$app/navigation';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { Toaster } from '$lib/components/ui/sonner';
	import PageProgress from '$lib/components/page-progress.svelte';
	import type { PageData } from './$types';
	import { setState, MAIN_STATE_CTX } from '$lib/state';
	import { mediaQuery } from 'svelte-legos';
	import { ParaglideJS } from '@inlang/paraglide-js-adapter-sveltekit'
	import { i18n } from '$lib/i18n.js'

	export let data: PageData;

	onNavigate((navigation) => {
		// @ts-ignore
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			// @ts-ignore
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	const largeScreen = mediaQuery('(min-width: 425px)');

	setState({
		currentRoute: '/',
		isAddingBill: false,
		user: data.user,
		history: data.history
	}, MAIN_STATE_CTX);
	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();
</script>

<Toaster position={$largeScreen ? 'bottom-right' : 'top-center'} />
<PageProgress />
<ModeWatcher />
<Header />
<ParaglideJS {i18n}>
    <slot />
</ParaglideJS>