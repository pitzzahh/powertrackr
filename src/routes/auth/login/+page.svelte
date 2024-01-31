<script lang="ts">
	import type { PageData } from './$types';
	import { Loader2 } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { loginFormSchema, type LoginFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';
	import { getState, MAIN_STATE_CTX } from '$lib/state';
	import type { State } from '$lib/types';
	import type { Writable } from 'svelte/store';

	export let data: PageData;

	const state: Writable<State> = getState(MAIN_STATE_CTX);

	$: processing = false;

	const options: FormOptions<LoginFormSchema> = {
		onSubmit() {
			toast.info('Logging in...');
			processing = true;
		},
		onResult({ result }) {
			if (result.status === 200) {
				toast.success('Logged-in successfully!');
			}
			if (result.status === 400 || result.status === 500) {
				{
					toast.error(result.data?.message || 'Please enter valid credentials', {
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
</script>

<svelte:head>
	<title>PowerTrackr Login</title>
</svelte:head>

<div class="container md:w-1/2">
	<h2>Login</h2>
	<Form.Root method="POST" form={data.form} {options} schema={loginFormSchema} let:config>
		<Form.Field {config} name="username">
			<Form.Item>
				<Form.Label>Username</Form.Label>
				<Form.Input />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="password">
			<Form.Item>
				<Form.Label>Password</Form.Label>
				<Form.Input type="password" />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Button disabled={processing}>
			{#if processing}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			{processing ? 'Please wait' : 'Login'}</Form.Button
		>
	</Form.Root>
	<p>
		Don't have an account?
		{#if processing}
			<span class="text-muted-foreground">register</span>
		{:else}
			<a href="register" class="hover:text-primary hover:underline hover:underline-offset-4"
				>register</a
			>
		{/if}
	</p>
</div>
