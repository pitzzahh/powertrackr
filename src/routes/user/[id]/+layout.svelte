<script lang="ts">
	import type { LayoutData } from './$types';
	import type { User } from '@prisma/client';
	import SidebarNav from '$lib/components/sidebar-nav.svelte';
	import type { NavItem } from '$lib/types';
	import { siteConfig } from '$lib/config/site';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { LogOut } from 'lucide-svelte';
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import { mediaQuery } from 'svelte-legos';
	import { cn } from '$lib/utils';
	import * as m from '$paraglide/messages';

	export let data: LayoutData;

	let user = data.user as User;

	$: isLoggingOut = false;

	const sidebarNavItems = siteConfig.profileLinks.map((item: NavItem) => {
		return {
			title: item.text,
			href: item.href.replace('[id]', user?.username)
		};
	});
	const canFitText = mediaQuery('(min-width: 340px)');
</script>

<div class="container">
	<h2>{m.settings()}</h2>
	<p class="mb-4 text-muted-foreground [&:not(:first-child)]:mt-1">
		{m.settings_desc()}
	</p>
	<div class=" flex flex-col sm:flex-row">
		<div class="flex grow flex-col gap-2 sm:flex-row">
			<aside class="flex items-center justify-start gap-2 sm:block sm:w-1/5">
				<SidebarNav class="grow" items={sidebarNavItems} />
				<Separator class="h-full w-[1px] sm:my-2 sm:h-[1px] sm:w-full" />
				<Button
					class="sm:w-full"
					variant="destructive"
					on:click={() => (isLoggingOut = true)}
					size="xs"
				>
					<LogOut class={cn('h-4 w-4', $canFitText && 'mr-2')} />
					{#if $canFitText}
						Logout
					{/if}
				</Button>
			</aside>
			<Separator class="my-2 hidden sm:flex" orientation="vertical" />
			<div class="max-w-2xl grow gap-2">
				<slot />
			</div>
		</div>
	</div>
</div>
<LogoutDialog bind:open={isLoggingOut} />
