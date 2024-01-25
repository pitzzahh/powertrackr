<script lang="ts">
	import { scaleTime } from 'd3-scale';
	import {
		Chart,
		Svg,
		Area,
		LinearGradient,
		Tooltip,
		ChartClipPath,
		Highlight,
		Axis
	} from 'layerchart';
	import { cubicInOut } from 'svelte/easing';
	import { format, PeriodType } from 'svelte-ux';
	import type { PageData } from './$types';
	import type { BillingInfo } from '@prisma/client';
	import { onMount } from 'svelte';
	import { generateSampleData } from '$lib';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { mediaQuery } from 'svelte-legos';

	export let data: PageData;

	let open = false;

	$: balanceHistory = data.user
		? data.user.billing_info?.length > 0
			? data.user?.billing_info.map((billing: BillingInfo) => ({
					date: new Date(billing.date),
					value: billing.balance
				}))
			: generateSampleData((Math.random() * 100) + 1)
		: [];

	$: noData = false;
	$: show = false;

	const notMobile = mediaQuery('(min-width: 768px)')

	onMount(() => {
		setTimeout(() => {
			show = (balanceHistory?.length ?? 0) !== 0;
			noData = !show;
		}, 1000);
	});
</script>

<svelte:head>
	<title
		>PowerTrackr: Combining "power" with "track," indicating the ability to monitor and track
		electricity consumption.</title
	>
</svelte:head>

<div class="container">
	<div class="flex items-center justify-between gap-2">
		<h1 class="ali">Monthly Balance History</h1>
		<div class="flex flex-col md:flex-row items-right justify-center gap-2">
			{#if $notMobile}
				<Dialog.Root bind:open>
					<Dialog.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]}>Add Data</Button>
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Edit profile</Dialog.Title>
							<Dialog.Description>
								Make changes to your profile here. Click save when you're done.
							</Dialog.Description>
						</Dialog.Header>
						<form class="grid items-start gap-4">
							<div class="grid gap-2">
								<Label for="email">Email</Label>
								<Input type="email" id="email" value="shadcn@example.com" />
							</div>
							<div class="grid gap-2">
								<Label for="username">Username</Label>
								<Input id="username" value="@shadcn" />
							</div>
							<Button type="submit">Save changes</Button>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			{:else}
				<Drawer.Root bind:open>
					<Drawer.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]}>Add Data</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header class="text-left">
							<Drawer.Title>Edit profile</Drawer.Title>
							<Drawer.Description>
								Make changes to your profile here. Click save when you're done.
							</Drawer.Description>
						</Drawer.Header>
						<form class="grid items-start gap-4 px-4">
							<div class="grid gap-2">
								<Label for="email">Email</Label>
								<Input type="email" id="email" value="shadcn@example.com" />
							</div>
							<div class="grid gap-2">
								<Label for="username">Username</Label>
								<Input id="username" value="@shadcn" />
							</div>
							<Button type="submit">Save changes</Button>
						</form>
						<Drawer.Footer class="pt-2">
							<Drawer.Close asChild let:builder>
								<Button variant="outline" builders={[builder]}>Cancel</Button>
							</Drawer.Close>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			{/if}
			<Button href="/history" variant="secondary">View History</Button>
		</div>
	</div>
	{#if show}
		<div class="h-80">
			<Chart
				aria-role="Chart"
				aria-label="Monthly Balance History Chart"
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
					<LinearGradient
						aria-role="LinearGradient"
						aria-label="Monthly balance history gradient"
						class="from-special-500/50 to-special-500/0"
						vertical
						let:url
					>
						{#if show}
							<Area
								aria-role="Area"
								aria-label="Path of the monthly balance history"
								line={{ class: 'stroke-2 stroke-special-500 opacity-20' }}
								draw={{ easing: cubicInOut, delay: 700 }}
								fill={url}
							/>
							<ChartClipPath
								x={0}
								y={0}
								initialWidth={0}
								width={tooltip.data ? tooltip.x : width}
								{height}
								spring
								tweened={{
									y: { duration: 1000, easing: cubicInOut, delay: 500 },
									height: { duration: 1000, easing: cubicInOut, delay: 500 }
								}}
							>
								<Area line={{ class: 'stroke-2 stroke-special-500' }} fill={url} />
							</ChartClipPath>
						{/if}
					</LinearGradient>
					<Highlight points lines={{ class: 'stroke-special-500 [stroke-dasharray:unset]' }} />
					<Axis placement="bottom" />
				</Svg>

				<Tooltip
					aria-role="Tooltip"
					aria-label="Monthly balance history tooltip containing the current balance"
					y={48}
					xOffset={4}
					variant="none"
					class="text-sm font-semibold leading-3 text-special-700"
					let:data
				>
					{format(data.value, 'currency', { currency: 'PHP' })}
				</Tooltip>

				<Tooltip
					aria-role="Tooltip"
					aria-label="Monthly balance history tooltip containing the current date"
					x={4}
					y={4}
					variant="none"
					class="text-sm font-semibold leading-3"
					let:data
				>
					{format(data.date, PeriodType.Day)}
				</Tooltip>

				<Tooltip
					aria-role="Tooltip"
					aria-label="Monthly balance history tooltip containing the current date"
					x="data"
					y={height + padding.top + 2}
					anchor="top"
					variant="none"
					class="whitespace-nowrap rounded bg-special-500 px-2 py-1 text-sm font-semibold leading-3 text-white"
					let:data
				>
					{format(data.date, PeriodType.Day)}
				</Tooltip>
			</Chart>
		</div>
	{:else if noData}
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
