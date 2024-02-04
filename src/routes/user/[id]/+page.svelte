<script lang="ts">
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { profileFormSchema, type ProfileFormSchema } from '$lib/config/formSchema';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitials } from '$lib';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { Writable } from 'svelte/store';
	import type { State } from '$lib/types';
	import type { FormOptions } from 'formsnap';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from 'lucide-svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$paraglide/messages';
	import { cn } from '$lib/utils';
	import { defaultUserAvatars } from '$lib/assets/default-user-avatar';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	let selectedFile: File | undefined;
	let avatarSrc = $state.user?.picture || '';
	$: processing = false;
	$: currentAvatar = avatarSrc || 'user1';

	const options: FormOptions<ProfileFormSchema> = {
		onSubmit() {
			toast.info('Saving...');
			processing = true;
		},
		onResult({ result }) {
			console.log(result);
			if (result.status === 200) {
				toast.success('Saved successfully!');
			}
			if (result.status === 400 || result.status === 500) {
				{
					toast.error(result.data?.message || 'Something went wrong', {
						description: new Date().toLocaleDateString('en-us', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							timeZone: 'UTC',
							timeZoneName: 'short'
						})
					});
				}
			}
			processing = false;
		}
	};

	const handleFileChange = (event: any) => {
		const [file] = event.target.files;
		selectedFile = file;

		avatarSrc = selectedFile ? URL.createObjectURL(selectedFile) : $state.user?.picture || '';
		console.log('Selected File:', avatarSrc);
	};

	$: {
		$state.user = data.user;
		$state.history = data.history;
	}
</script>

<svelte:head>
	<title>{data.user?.name} profile settings</title>
</svelte:head>

<h4>Profile</h4>
<p
	class="mb-2 text-sm text-muted-foreground [&:not(:first-child)]:mt-1 md:[&:not(:first-child)]:mt-1"
>
	{m.profile_desc()}
</p>
<Separator class="my-4" />
<Form.Root
	method="POST"
	enctype="multipart/form-data"
	form={data.form}
	{options}
	schema={profileFormSchema}
	let:config
>
	<Form.Field {config} name="avatar">
		<Form.Item class="relative flex items-start">
			<Label for="avatar" class="relative">
				<Avatar.Root class="m-2 h-32 w-32">
					<Avatar.Image src={avatarSrc} alt="@{$state.user?.username}" />
					<Avatar.Fallback class="text-xl">{getInitials($state.user?.name)}</Avatar.Fallback>
				</Avatar.Root>
				<Form.Input
					type="file"
					accept="image/*"
					id="avatar"
					class="hidden"
					on:change={handleFileChange}
				/>
				<span
					class="absolute bottom-6 left-[2.2rem] transform text-center text-sm text-muted-foreground opacity-100 transition-opacity hover:cursor-pointer sm:opacity-0 sm:hover:opacity-100"
				>
					Choose File
				</span>
			</Label>
			<div class="grid h-40 grid-flow-row auto-rows-max gap-1 overflow-auto scrollbar-hide">
				<RadioGroup.Root
					value={currentAvatar}
					class="flex flex-wrap items-center justify-center gap-2"
					onValueChange={async (val) => {
						currentAvatar = val;
						// @ts-ignore
						avatarSrc = defaultUserAvatars.find((avatar) => avatar.id === Number(currentAvatar))?.src.img.src || '';
					}}
				>
					{#each defaultUserAvatars as avatar}
						<Label
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
						</Label>
					{/each}
				</RadioGroup.Root>
			</div>

			<Form.Validation />
		</Form.Item>
	</Form.Field>
	{#if avatarSrc !== $state.user?.picture}
		<Form.Button disabled={processing}>
			{#if processing}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			{processing ? 'Please wait' : 'Save'}</Form.Button
		>
	{/if}
</Form.Root>
