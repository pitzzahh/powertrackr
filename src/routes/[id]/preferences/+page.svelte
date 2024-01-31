<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.user?.name} preference settings</title>
</svelte:head>

<h4>Preferences</h4>
<p class="text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1 sm:mb-6">
	Customize the app based on your preferences such as themes etc.
</p>