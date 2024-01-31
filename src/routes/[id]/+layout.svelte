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

	export let data: LayoutData;

	let user = data.user as User;

	$: isLoggingOut = false;

	const sidebarNavItems = siteConfig.profileLinks.map((item: NavItem) => {
		return {
			title: item.text,
			href: item.href.replace('user', user?.username)
		};
	});
	const canFitText = mediaQuery('(min-width: 340px)');
</script>

<div class="container">
	<h2>Settings</h2>
	<p class="mb-4 text-muted-foreground [&:not(:first-child)]:mt-1">
		Manage your account settings and set preferences.
	</p>
	<div class=" flex flex-col sm:flex-row">
		<div class="flex grow flex-col gap-2 sm:flex-row">
			<aside class="flex items-center justify-start gap-1 sm:block sm:w-1/5">
				<SidebarNav class="grow" items={sidebarNavItems} />
				<Button
					class="my-2 sm:w-full"
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
