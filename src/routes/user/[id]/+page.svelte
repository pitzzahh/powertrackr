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
	import { Separator } from '$lib/components/ui/separator';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	let selectedFile: File | undefined;
	let avatarSrc = $state.user?.picture || '';
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

	const handleFileChange = (event: any) => {
		const [file] = event.target.files;
		selectedFile = file;

		avatarSrc = selectedFile ? URL.createObjectURL(selectedFile) : $state.user?.picture || '';
		console.log('Selected File:', selectedFile);
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
	This is how you will see yourself on the site.
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
	<Form.Field {config} name="picture">
		<Form.Item class="group relative flex flex-col items-start">
			<label for="avatarInput" class="relative cursor-pointer">
				<Avatar.Root class="m-2 h-32 w-32">
					<Avatar.Image src={avatarSrc} alt="@{$state.user?.username}" />
					<Avatar.Fallback class="text-xl">{getInitials($state.user?.name)}</Avatar.Fallback>
				</Avatar.Root>
				<Form.Input
					type="file"
					accept="image/*"
					id="avatarInput"
					class="hidden"
					on:change={handleFileChange}
				/>
				<span
					class="absolute bottom-6 w-full transform text-center text-sm text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
				>
					Choose File
				</span>
			</label>
			<Form.Validation />
		</Form.Item>
	</Form.Field>
	<Form.Button disabled={processing}>
		{#if processing}
			<Loader2 class="mr-2 h-4 w-4 animate-spin" />
		{/if}
		{processing ? 'Please wait' : 'Save'}</Form.Button
	>
</Form.Root>
