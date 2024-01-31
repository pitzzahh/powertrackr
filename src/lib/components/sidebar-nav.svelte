<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	let className: string | undefined | null = undefined;
	export let items: { href: string; title: string }[];
	export { className as class };

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<nav
	class={cn(
		'flex space-x-2 overflow-auto rounded-md bg-muted scrollbar-hide sm:flex-col sm:space-x-0 sm:space-y-1',
		className
	)}
>
	{#each items as item}
		{@const isActive = $page.url.pathname === item.href}
		<Button
			href={item.href}
			size="sm"
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
					class="absolute inset-1 rounded-md bg-primary"
					in:send={{ key: 'active-sidebar-tab' }}
					out:receive={{ key: 'active-sidebar-tab' }}
				/>
			{/if}
			<div class="relative">
				{item.title}
			</div>
		</Button>
	{/each}
</nav>
