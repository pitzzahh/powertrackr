<script lang="ts">
	import { cn } from '$lib/utils/style';
	import QR from '@svelte-put/qr/svg/QR.svelte';
	import type { Snippet } from 'svelte';

	let {
		value,
		size = 128,
		color = '#000000',
		backgroundColor = '#FFFFFF',
		errorCorrection = 'M',
		margin = 2,
		class: className,
		logo,
		logoSize = 0.2
	}: {
		value: string;
		size?: number;
		color?: string;
		backgroundColor?: string;
		errorCorrection?: 'L' | 'M' | 'Q' | 'H';
		margin?: number;
		class?: string;
		logo?: string | Snippet;
		logoSize?: number;
	} = $props();
</script>

<div
	class={cn('relative inline-flex items-center justify-center shrink-0', className)}
	style:width={`${size}px`}
	style:height={`${size}px`}
	style:background-color={backgroundColor}
>
	<QR
		data={value}
		moduleFill={color}
		anchorOuterFill={color}
		anchorInnerFill={color}
		correction={errorCorrection}
		{margin}
		class="h-full w-full"
	/>

	{#if logo}
		<div
			class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-background rounded-full p-1 shadow-sm"
			style:width={`${size * logoSize}px`}
			style:height={`${size * logoSize}px`}
		>
			{#if typeof logo === 'string'}
				<img src={logo} alt="QR Logo" class="h-full w-full object-contain" />
			{:else}
				{@render logo()}
			{/if}
		</div>
	{/if}
</div>
