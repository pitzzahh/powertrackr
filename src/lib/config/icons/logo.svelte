<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { siteConfig } from '../site';
	type $$Props = HTMLAttributes<SVGElement>;
</script>

<button
	class="space-between flex cursor-pointer items-center justify-center rounded-sm bg-primary px-[0.1rem]"
	{...$$restProps}
	on:click
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="white"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-database-zap"
		><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 15 21.84" /><path
			d="M21 5V8"
		/><path d="M21 12L18 17H22L19 22" /><path d="M3 12A9 3 0 0 0 14.59 14.87" /></svg
	>
	<span class="mr-1 translate-y-[-0.2rem] text-2xl font-bold text-slate-100">{siteConfig.name}</span
	>
</button>
