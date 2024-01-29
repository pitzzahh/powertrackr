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
	import type { LayoutData } from './$types';
	import { setState } from '$lib/state';
	import { mediaQuery } from 'svelte-legos';

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

	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	const state: State = {
		isAddingBill: false
	};
	const largeScreen = mediaQuery('(min-width: 425px)');

	setState(state);

	export let data: LayoutData;
</script>

<Toaster position={$largeScreen ? 'bottom-right' : 'top-center'} />
<PageProgress />
<ModeWatcher />
<Header user={data?.user} />
<slot />
