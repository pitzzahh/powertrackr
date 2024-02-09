<script lang="ts">
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { registerFormSchema, type RegisterFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';
	import * as m from '$paraglide/messages';
	import { languageTag } from '$paraglide/runtime';

	export let data: PageData;

	$: processing = false;

	const options: FormOptions<RegisterFormSchema> = {
		onSubmit() {
			toast.info(`${m.registering()}...`);
			processing;
		},
		onResult({ result }) {
			if (result.status === 301) toast.success(m.register_success());
			if (result.status === 400 || result.status === 500) {
				{
					toast.error(result.data?.message || m.invalid_credentials(), {
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
</script>

<svelte:head>
	<title>PowerTrackr {m.register()}</title>
</svelte:head>

<div class="container md:w-1/2">
	<h2>{m.register()}</h2>
	<Form.Root method="POST" form={data.form} {options} schema={registerFormSchema} let:config>
		<Form.Field {config} name="name">
			<Form.Item>
				<Form.Label>{m.name()}</Form.Label>
				<Form.Input />
				<Form.Description>{m.public_display_notice({ info: 'name' })}</Form.Description>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="username">
			<Form.Item>
				<Form.Label>{m.username()}</Form.Label>
				<Form.Input />
				<Form.Description>{m.public_display_notice({ info: 'username' })}</Form.Description>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="password">
			<Form.Item>
				<Form.Label>{m.password()}</Form.Label>
				<Form.Input type="password" />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="confirmPassword">
			<Form.Item>
				<Form.Label>{m.confirm_pass()}</Form.Label>
				<Form.Input type="password" />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Button disabled={processing}>
			{#if processing}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			{processing ? 'Please wait' : 'Register'}</Form.Button
		>
	</Form.Root>
	<p>
		{m.have_account()}
		{#if processing}
			<span class="text-muted-foreground">{m.login()}</span>
		{:else}
			<a href="/auth/login" class="hover:text-primary hover:underline hover:underline-offset-4"
				>{m.login()}</a
			>
		{/if}
	</p>
</div>
