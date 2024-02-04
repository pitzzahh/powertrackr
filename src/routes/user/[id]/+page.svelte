<script lang="ts">
	import type { PageData } from './$types';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitials } from '$lib';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from 'lucide-svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$paraglide/messages';
	import { defaultUserAvatars } from '$lib/assets/default-user-avatar';
	import { v2 } from 'cloudinary';
	import { onMount } from 'svelte';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	let selectedFile: File | undefined;
	let avatarSrc = $state.user?.picture || '';
	let processing = false;
	$: currentAvatar = avatarSrc || '';

	const handleFileChange = (event: any) => {
		const [file] = event.target.files;
		selectedFile = file;

		avatarSrc = selectedFile ? URL.createObjectURL(selectedFile) : $state.user?.picture || '';
		console.log('Selected File:', avatarSrc);
	};

	const filePathOnCloudinary = (path: string) => `powertrackr/${$state.user?.username}/${path}`;

	const upload = () => {
		toast.info('Saving...');
		processing = true;
		v2.uploader
			.upload(avatarSrc, { public_id: filePathOnCloudinary(avatarSrc) })
			.then((result) => {
				console.log(`result`, result);
				toast.success('Saved successfully!');
			})
			.catch((error) => console.error(`error`, error))
			.finally(() => (processing = false));
	};

	$: {
		$state.user = data.user;
		$state.history = data.history;
	}

	onMount(() => {
		v2.config({
			cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
			api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
			api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
		});
	});
</script>

<svelte:head>
	<title>{$state.user?.name} profile settings</title>
</svelte:head>

<h4>Profile</h4>
<p
	class="mb-2 text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1"
>
	{m.profile_desc()}
</p>

<Separator class="my-4" />

<div class="flex items-center">
	<label for="avatar" class="relative">
		<Avatar.Root class="m-2 h-32 w-32">
			<Avatar.Image src={avatarSrc} alt="@{$state.user?.username}" />
			<Avatar.Fallback class="text-xl">{getInitials($state.user?.name)}</Avatar.Fallback>
		</Avatar.Root>
		<input type="file" accept="image/*" id="avatar" class="hidden" on:change={handleFileChange} />
		<span
			class="absolute bottom-6 left-[2.2rem] transform text-center text-sm text-muted-foreground opacity-100 transition-opacity hover:cursor-pointer sm:opacity-0 sm:hover:opacity-100"
		>
			Choose File
		</span>
		{#if avatarSrc !== $state.user?.picture}
			<button disabled={processing} on:click={upload}>
				{#if processing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				{processing ? 'Please wait' : 'Save'}</button
			>
		{/if}
	</label>
	<div class="flex h-40 items-center gap-1 overflow-auto scrollbar-hide">
		<RadioGroup.Root
			value={currentAvatar}
			class="flex flex-wrap items-center justify-center gap-2"
			onValueChange={(val) => {
				currentAvatar = val;
				const avatar = defaultUserAvatars.find((avatar) => avatar.id === Number(val));
				// @ts-ignore
				avatarSrc = avatar?.src.img.src || defaultUserAvatars[0].src.img.src;
			}}
		>
			{#each defaultUserAvatars as avatar}
				<label
					for={avatar.id.toString()}
					class="h-20 w-20 rounded-full bg-popover p-1 hover:cursor-pointer hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
				>
					<enhanced:img
						src={avatar.src}
						alt={avatar.id.toString()}
						style="width:100%; height:100%; object-fit:cover border-radius:9999px;"
					/>
					<RadioGroup.Item
						value={avatar.id.toString()}
						id={avatar.id.toString()}
						class="sr-only"
						aria-label={avatar.id.toString()}
					/>
				</label>
			{/each}
		</RadioGroup.Root>
	</div>
</div>
