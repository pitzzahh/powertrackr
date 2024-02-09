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
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$paraglide/messages';
	import { defaultUserAvatars } from '$lib/assets/default-user-avatar';
	import { Label } from '$lib/components/ui/label';
	import type { FormOptions } from 'formsnap';
	import { languageTag } from '$paraglide/runtime';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	$: avatarSrc = $state.user?.picture
		? defaultUserAvatars.find((avatar) => avatar.id === $state.user?.picture)?.src ?? null
		: null;
	$: processing = false;

	const options: FormOptions<ProfileFormSchema> = {
		onSubmit() {
			toast.info(m.saving());
			processing = true;
		},
		onResult({ result }) {
			console.log(result);
			if (result.status === 200) {
				toast.success(m.saved_success());
			}
			if (result.status === 400 || result.status === 500) {
				{
					toast.error(result.data?.message || m.something_went_wrong(), {
						description: new Date().toLocaleDateString(languageTag(), {
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
	<title>{data.user?.name} {m.profile_route_title()}</title>
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
			<Label for="avatar" class="h-32 w-32 shrink-0">
				{#if avatarSrc}
					<enhanced:img
						src={avatarSrc}
						alt="@{$state.user?.username}"
						class="aspect-square h-full w-full rounded-full"
						style="object-fit:cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center rounded-full bg-accent">
						<span class="text-lg text-accent-foreground">
							{getInitials($state.user?.name)}
						</span>
					</div>
				{/if}
			</Label>
			<Form.RadioGroup
				class="grid h-40 grow grid-cols-3 place-items-center gap-2 overflow-y-auto scrollbar-hide sm:grid-cols-5 md:grid-cols-9 lg:auto-cols-fr"
				onValueChange={(val) => {
					avatarSrc = defaultUserAvatars.find((avatar) => avatar.id === val)?.src || '';
				}}
			>
				{#each defaultUserAvatars as avatar}
					<Form.Item
						class="h-16 w-16  rounded-full bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
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
	{#if defaultUserAvatars.find((avatar) => avatar.id === $state.user?.picture)?.src !== avatarSrc}
		<Form.Button disabled={processing}>
			{#if processing}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			{processing ? 'Please wait' : 'Save'}</Form.Button
		>
	{/if}
</Form.Root>
