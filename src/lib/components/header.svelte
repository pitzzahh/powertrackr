<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { getInitials } from '$lib';
	import {
		Sun,
		Moon,
		Menu,
		Settings,
		Palette,
		LogOut,
		User as UserIcon,
		UserPlus,
		FolderClock,
		Home
	} from 'lucide-svelte';
	import { setMode, resetMode, toggleMode } from 'mode-watcher';
	import { page } from '$app/stores';
	import { Icons } from '$lib/config/icons';
	import { goto } from '$app/navigation';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import { defaultUserAvatars } from '$lib/assets/default-user-avatar';
	import { Label } from '$lib/components/ui/label';
	import * as m from '$paraglide/messages';
		
	const state: Writable<State> = getState(MAIN_STATE_CTX);

	$: avatarSrc = $state.user?.picture
		? defaultUserAvatars.find((avatar) => avatar.id === $state.user?.picture)?.src ?? null
		: null;
	$: isLoggingOut = false;
	$: isLoginPage = $page.route.id === `/auth/login`;
	$: hasUser = !!$state.user;
</script>

<header class="shadown-sm container flex items-center justify-between backdrop-blur-[10px]">
	<div class="flex items-center justify-start gap-1">
		<Icons.logo
			on:click={() => {
				$state.currentRoute = '/';
				goto($state.currentRoute);
			}}
		/>
	</div>

	<div class="flex h-14 items-center justify-center gap-1">
		{#if hasUser}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" class="transparent h-8 w-8 rounded-full">
						<Label for="avatar" class="h-8 w-8 shrink-0 hover:cursor-pointer">
							{#if avatarSrc}
								<enhanced:img
									src={avatarSrc}
									alt="@{$state.user?.username}"
									class="aspect-square h-full w-full rounded-full"
									style="object-fit:cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center rounded-full bg-accent">
									<span class="text-sm text-accent-foreground">
										{getInitials($state.user?.name)}
									</span>
								</div>
							{/if}
						</Label>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>{m.my_account()}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							on:click={() => {
								if ($state.user) goto(`/user/${$state.user?.username}`);
							}}
						>
							<UserIcon class="mr-2 h-4 w-4" />
							{m.profile()}
						</DropdownMenu.Item>
						<DropdownMenu.Item
							on:click={() => {
								if ($state.user) goto(`/user/${$state.user?.username}/preferences`);
							}}
						>
							<Palette class="mr-2 h-4 w-4" />
							{m.preferences()}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item on:click={() => (isLoggingOut = true)}>
							<LogOut class="mr-2 h-4 w-4" />
							{m.logout()}</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<div class="flex items-center justify-center gap-2 transition-all">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button title="menu-button" variant="outline" builders={[builder]} size="icon">
							<Menu />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-auto">
						<DropdownMenu.Label>{m.menu()}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.RadioGroup bind:value={$state.currentRoute}>
							<div class="gap-2">
								<DropdownMenu.RadioItem
									on:click={() => goto('/')}
									value={'/'}
									class={$page.route && '/' === $page.route.id
										? 'font-bold text-primary'
										: 'transition-all'}
								>
									<Home class="mr-2 h-4 w-4" />
									{m.home()}</DropdownMenu.RadioItem
								>
								<DropdownMenu.RadioItem
									on:click={() => goto('/history')}
									value={'/history'}
									class={$page.route && '/history' === $page.route.id
										? 'font-bold text-primary'
										: 'transition-all'}
								>
									<FolderClock class="mr-2 h-4 w-4" />
									{m.history()}</DropdownMenu.RadioItem
								>
							</div>
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator />
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>
								<Palette class="mr-2 h-4 w-4" />
								<span>{m.set_theme()}</span>
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								<DropdownMenu.Item on:click={() => setMode('light')}>
									<Sun class="mr-2 h-4 w-4" />
									{m.light()}
								</DropdownMenu.Item>
								<DropdownMenu.Item on:click={() => setMode('dark')}>
									<Moon class="mr-2 h-4 w-4" />
									{m.dark()}</DropdownMenu.Item
								>
								<DropdownMenu.Item on:click={() => resetMode()}>
									<Settings class="mr-2 h-4 w-4" />
									{m.system()}</DropdownMenu.Item
								>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{:else}
			<Button href="/auth/{isLoginPage ? 'register' : 'login'}">
				{#if isLoginPage}
					<UserPlus class="mr-1 h-4 w-4" />
				{:else}
					<UserIcon class="mr-1 h-4 w-4" />
				{/if}
				<span>{isLoginPage ? m.register() : m.login()}</span>
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

<LogoutDialog bind:open={isLoggingOut} />
