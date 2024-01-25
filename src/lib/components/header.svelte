<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { siteConfig } from '$lib/config/site';
	import {
		Sun,
		Moon,
		Menu,
		Settings,
		Palette,
		LogOut,
		User as UserIcon,
		UserPlus
	} from 'lucide-svelte';
	import { setMode, resetMode, toggleMode } from 'mode-watcher';
	import { page } from '$app/stores';
	import { Icons } from '$lib/config/icons';
	import { goto } from '$app/navigation';
	import type { User } from '@prisma/client';

	export let user: User | null | undefined;

	let route = '/';
	let isLoggingOut = false;

	$: isLoginPage = $page.url.href === `${$page.url.protocol}//${$page.url.host}/auth/login`;
	$: hasUser = !!user;
</script>

<header
	class="shadown-sm container sticky top-0 z-50 flex items-center justify-between backdrop-blur-[10px]"
>
	<div class="flex items-center justify-start gap-1">
		<Icons.logo on:click={() => {
			route = '/'
			goto(route)
		}} />
	</div>

	<div class="flex h-14 items-center justify-between gap-1">
		{#if hasUser}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" class="h-8 w-8 rounded-full ">
						<Avatar.Root class="h-8 w-8">
							<Avatar.Image
								src={user?.picture || `${$page.url.protocol}//${$page.url.host}/default-user.png`}
								alt="@{user?.username}"
							/>
							<Avatar.Fallback>{user?.username}</Avatar.Fallback>
						</Avatar.Root>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each siteConfig.profileLinks as pf}
							<DropdownMenu.Item
								on:click={() => {
									if (user) goto(pf.href.replace('user', user.username));
								}}
							>
								<svelte:component this={pf.icon} class="mr-2 h-4 w-4" />
								{pf.text}
							</DropdownMenu.Item>
						{/each}
						<DropdownMenu.Separator />
						<DropdownMenu.Item on:click={() => (isLoggingOut = true)}>
							<svelte:component this={LogOut} class="mr-2 h-4 w-4" />
							Logout</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<div class="flex items-center justify-center gap-2 transition-all">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]} size="icon">
							<Menu />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-auto">
						<DropdownMenu.Label>Menu</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each siteConfig.navLinks as link}
							<DropdownMenu.RadioGroup bind:value={route}>
								<div class="gap-2">
									<DropdownMenu.RadioItem
										on:click={() => goto(link.href)}
										value={link.href}
										class={$page.route && link.href === $page.route.id
											? 'font-bold text-primary'
											: 'transition-all'}
									>
										<svelte:component this={link.icon} class="mr-2 h-4 w-4">
											{link.icon}
										</svelte:component>
										{link.text}</DropdownMenu.RadioItem
									>
								</div>
							</DropdownMenu.RadioGroup>
						{/each}
						<DropdownMenu.Separator />
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>
								<Palette class="mr-2 h-4 w-4" />
								<span>Set Theme</span>
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								<DropdownMenu.Item on:click={() => setMode('light')}>
									<Sun class="mr-2 h-4 w-4" />
									Light
								</DropdownMenu.Item>
								<DropdownMenu.Item on:click={() => setMode('dark')}>
									<Moon class="mr-2 h-4 w-4" />
									Dark</DropdownMenu.Item
								>
								<DropdownMenu.Item on:click={() => resetMode()}>
									<Settings class="mr-2 h-4 w-4" />
									System</DropdownMenu.Item
								>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{:else}
			<Button
				href="{$page.url.protocol}//{$page.url.host}/auth/{isLoginPage ? 'register' : 'login'}"
			>
				{#if isLoginPage}
					<UserPlus class="mr-1 h-4 w-4" />
				{:else}
					<UserIcon class="mr-1 h-4 w-4" />
				{/if}
				<span>{isLoginPage ? 'Register' : 'Login'}</span>
			</Button>
		{/if}
		<Button on:click={toggleMode} variant="outline" size="icon">
			<Sun
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<Moon
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>
</header>

<AlertDialog.Root bind:open={isLoggingOut}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure you want to logout?</AlertDialog.Title>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				on:click={() => {
					goto(`${$page.url.protocol}//${$page.url.host}/${user?.username}/logout`);
					isLoggingOut = false;
					hasUser = false;
				}}>Logout</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
