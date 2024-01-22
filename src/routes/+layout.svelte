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
	export let data: LayoutData;
</script>

<Toaster richColors closeButton />
<PageProgress />
<ModeWatcher />
<Header user={data?.user}/>
<slot />
