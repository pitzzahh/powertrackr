<script lang="ts">
	import type { LayoutData } from './$types';
	import type { User } from '@prisma/client';
	import SidebarNav from '$lib/components/sidebar-nav.svelte';
	import type { NavItem } from '$lib/types';
	import { siteConfig } from '$lib/config/site';
	import { Separator } from '$lib/components/ui/separator';

	export let data: LayoutData;

	let user = data.user as User;

	const sidebarNavItems = siteConfig.profileLinks.map((item: NavItem) => {
		return {
			title: item.text,
			href: item.href.replace('user', user?.username)
		};
	});
</script>

<div class="container">
	<h2>Settings</h2>
	<p class="text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1">
		Manage your account settings and set preferences.
	</p>
	<Separator class="my-2"/>
	<div class=" flex flex-col sm:flex-row">
		<div class="flex flex-col gap-2 sm:flex-row">
			<aside>
				<SidebarNav items={sidebarNavItems} />
			</aside>
			<Separator class="hidden my-2 sm:flex" orientation="vertical" />
			<div class="sm:max-w-full gap-2">
				<slot />
			</div>
		</div>
	</div>
</div>
