<script lang="ts">
	import BillForm from '$lib/components/bill-form.svelte';
	import { scaleTime } from 'd3-scale';
	import {
		Chart,
		Svg,
		Area,
		LinearGradient,
		Tooltip,
		RectClipPath,
		Highlight,
		Axis
	} from 'layerchart';
	import { format, PeriodType } from 'svelte-ux';
	import type { PageData } from './$types';
	import type { BillingInfo } from '@prisma/client';
	import { generateSampleData } from '$lib';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { mediaQuery } from 'svelte-legos';
	import { cn } from '$lib/utils';

	export let data: PageData;

	$: balanceHistory = data.user
		? data.user.billing_info?.length > 0
			? data.user?.billing_info.map((billing: BillingInfo) => ({
					date: new Date(billing.date),
					value: billing.balance
				}))
			: generateSampleData(Math.random() * 100 + 1)
		: [];

	$: show = balanceHistory?.length > 0 && balanceHistory !== undefined;
	$: oldestDate = balanceHistory?.length > 0 ? balanceHistory[0].date : new Date();
	$: latestDate =
		balanceHistory?.length > 0 ? balanceHistory[balanceHistory.length - 1].date : new Date();

	const largeScreen = mediaQuery('(min-width: 768px)');
</script>

<svelte:head>
	<title>PowerTrackr: Monitor and track electricity consumption.</title>
</svelte:head>

<div class="container">
	<div class="flex items-end md:items-center justify-between gap-2">
		<div class={cn('flex flex-col items-start justify-start')}>
			<h1>Monthly Balance History</h1>
			{#if show}
				<p
					class={cn(
						'text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-2'
					)}
				>
					From {format(oldestDate, PeriodType.Day)} to {format(latestDate, PeriodType.Day)}
				</p>
			{/if}
		</div>
		{#if show}
			{#if $largeScreen}
				<Dialog.Root>
					<Dialog.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]}>Add Data</Button>
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Billing Info</Dialog.Title>
							<Dialog.Description>
								Enter the billing info for the month. Click Add when you're done.
							</Dialog.Description>
						</Dialog.Header>
						<BillForm {data} />
					</Dialog.Content>
				</Dialog.Root>
			{:else}
				<Drawer.Root>
					<Drawer.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]}>Add Data</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<div class="mx-auto w-full max-w-sm">
							<Drawer.Header class="text-left">
								<Drawer.Title>Billing Info</Drawer.Title>
								<Drawer.Description
									>Enter the billing info for the month. Click Add when you're done.</Drawer.Description
								>
							</Drawer.Header>
							<div class="mx-[0.9rem]">
								<BillForm {data} />
							</div>
							<Drawer.Footer class="pt-2">
								<Drawer.Close asChild let:builder>
									<Button variant="outline" builders={[builder]}>Cancel</Button>
								</Drawer.Close>
							</Drawer.Footer>
						</div>
					</Drawer.Content>
				</Drawer.Root>
			{/if}
		{/if}
	</div>
	{#if show}
		<div class="mt-2 h-80">
			<Chart
				data={balanceHistory}
				x="date"
				xScale={scaleTime()}
				y="value"
				yDomain={[0, null]}
				yNice
				tooltip
				let:width
				let:height
				let:padding
				let:tooltip
			>
				<Svg>
					<LinearGradient class="from-green-500/50 to-green-500/0" vertical let:url>
							<Area line={{ class: 'stroke-2 stroke-green-500 opacity-20' }} fill={url} />
							<RectClipPath
								x={0}
								y={0}
								width={tooltip.data ? tooltip.x : width}
								{height}
								initialWidth={0}
								spring
							>
								<Area initialHeight={0} line={{ class: 'stroke-2 stroke-green-500' }} fill={url} />
							</RectClipPath>
					</LinearGradient>
					<Highlight points lines={{ class: 'stroke-green-500 [stroke-dasharray:unset]' }} />
					<Axis placement="bottom" />
				</Svg>

				<Tooltip y={48} xOffset={4} variant="none" class="text-sm font-semibold leading-3" let:data>
					{format(data.value, 'currency', { currency: 'PHP' })}
				</Tooltip>

				<Tooltip x={4} y={1} variant="none" class="text-sm font-semibold leading-3" let:data>
					{format(data.date, PeriodType.Day)}
				</Tooltip>

				<Tooltip
					x="data"
					y={height + padding.top + 2}
					anchor="top"
					variant="none"
					class="whitespace-nowrap rounded bg-green-500 px-2 py-1 text-sm font-semibold leading-3"
					let:data
				>
					{format(data.date, PeriodType.Day)}
				</Tooltip>
			</Chart>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center text-center">
			<svg
				fill="currentColor"
				class="mt-6"
				height="200px"
				width="200px"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				viewBox="0 0 60 60"
				xml:space="preserve"
			>
				<g>
					<path
						d="M9,39h6v8c0,0.552,0.448,1,1,1s1-0.448,1-1v-8h3c0.552,0,1-0.448,1-1s-0.448-1-1-1h-3v-2c0-0.552-0.448-1-1-1s-1,0.448-1,1 v2h-5V27c0-0.552-0.448-1-1-1s-1,0.448-1,1v11C8,38.552,8.448,39,9,39z"
					></path>
					<path
						d="M40,39h6v8c0,0.552,0.448,1,1,1s1-0.448,1-1v-8h3c0.552,0,1-0.448,1-1s-0.448-1-1-1h-3v-2c0-0.552-0.448-1-1-1 s-1,0.448-1,1v2h-5V27c0-0.552-0.448-1-1-1s-1,0.448-1,1v11C39,38.552,39.448,39,40,39z"
					></path>
					<path
						d="M29.5,48c3.584,0,6.5-2.916,6.5-6.5v-9c0-3.584-2.916-6.5-6.5-6.5S23,28.916,23,32.5v9C23,45.084,25.916,48,29.5,48z M25,32.5c0-2.481,2.019-4.5,4.5-4.5s4.5,2.019,4.5,4.5v9c0,2.481-2.019,4.5-4.5,4.5S25,43.981,25,41.5V32.5z"
					></path> <path d="M0,0v14v46h60V14V0H0z M2,2h56v10H2V2z M58,58H2V14h56V58z"></path>
					<polygon
						points="54.293,3.293 52,5.586 49.707,3.293 48.293,4.707 50.586,7 48.293,9.293 49.707,10.707 52,8.414 54.293,10.707 55.707,9.293 53.414,7 55.707,4.707 "
					></polygon> <path d="M3,11h39V3H3V11z M5,5h35v4H5V5z"></path>
				</g>
			</svg>
			<p class="text-sm text-muted-foreground">No history data found at the moment</p>
		</div>
	{/if}
</div>
