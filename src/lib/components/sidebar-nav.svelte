<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import { MAIN_STATE_CTX, getState } from '$lib/state';
	let className: string | undefined | null = undefined;
	export let items: { href: string; title: string }[];
	export { className as class };

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<nav class={cn('flex overflow-auto scrollbar-hide sm:flex-col', className)}>
	{#each items as item}
		{@const isActive = $page.url.pathname === item.href}
		<Button
			on:click={() => ($state.currentRoute = item.href)}
			href={item.href}
			size="xs"
			variant="ghost"
			class={cn(
				!isActive && 'hover:underline',
				'relative justify-start selection:hover:bg-transparent',
				isActive && 'text-white hover:text-white'
			)}
			data-sveltekit-noscroll
		>
			{#if isActive}
				<div
					class="absolute inset-0 rounded-md bg-primary"
					in:send={{ key: 'active-sidebar-tab' }}
					out:receive={{ key: 'active-sidebar-tab' }}
				/>
			{/if}
			<div class="relative w-20">
				{item.title}
			</div>
		</Button>
	{/each}
</nav>
