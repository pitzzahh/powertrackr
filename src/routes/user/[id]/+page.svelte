<script lang="ts">
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { profileFormSchema, type ProfileFormSchema } from '$lib/config/formSchema';
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
	let avatarSrc = $state.user?.picture ? defaultUserAvatars.find((avatar) => avatar.id === $state.user?.picture)?.src : '';
	$: processing = false;

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

	$: {
		$state.user = data.user;
		$state.history = data.history;
	}
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
<Form.Root
	method="POST"
	enctype="multipart/form-data"
	form={data.form}
	{options}
	schema={profileFormSchema}
	let:config
>
	<Form.Field {config} name="avatar">
		<Form.Item class="relative flex items-center justify-start">
			<enhanced:img
			class="rounded-full m-2 h-32 w-32"
					src={avatarSrc}
					alt={getInitials($state.user?.name)}
					style="width:100%; height:100%; object-fit:cover border-radius:9999px;"
				/>
			<Form.RadioGroup
				class="grid h-40 grid-cols-3 overflow-auto scrollbar-hide sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12"
				onValueChange={(val) => {
					avatarSrc = defaultUserAvatars.find((avatar) => avatar.id === val)?.src || '';
				}}
			>
				{#each defaultUserAvatars as avatar}
					<Form.Item
						class="h-16 w-16  rounded-full bg-popover p-1  hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
					>
						<Label for={avatar.id} class="hover:cursor-pointer">
							<enhanced:img
								src={avatar.src}
								alt={avatar.id}
								style="width:100%; height:100%; object-fit:cover border-radius:9999px;"
							/>
							<Form.RadioItem
								value={avatar.id}
								id={avatar.id}
								class="sr-only"
								aria-label={avatar.id}
							/>
						</Label>
					</Form.Item>
				{/each}
			</Form.RadioGroup>
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
