<script lang="ts">
	import type { PageData } from './$types';
	import { Loader2 } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { loginFormSchema, type LoginFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';
	import * as m from '$paraglide/messages';
	import { languageTag } from '$paraglide/runtime';

	export let data: PageData;

	$: processing = false;

	const options: FormOptions<LoginFormSchema> = {
		onSubmit() {
			toast.info(`${m.logging_in()}...`);
			processing = true;
		},
		onResult({ result }) {
			if (result.status === 200) {
				toast.success(m.login_success());
			}
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
	<title>PowerTrackr {m.login()}</title>
</svelte:head>

<div class="container md:w-1/2">
	<h2>{m.login()}</h2>
	<Form.Root method="POST" form={data.form} {options} schema={loginFormSchema} let:config>
		<Form.Field {config} name="username">
			<Form.Item>
				<Form.Label>{m.username()}</Form.Label>
				<Form.Input />
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
		<Form.Button disabled={processing}>
			{#if processing}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			{processing ? m.please_wait() : m.login()}</Form.Button
		>
	</Form.Root>
	<p>
		{m.no_account()}
		{#if processing}
			<span class="text-muted-foreground">{m.register()}</span>
		{:else}
			<a href="/auth/register" class="hover:text-primary hover:underline hover:underline-offset-4"
				>{m.register()}</a
			>
		{/if}
	</p>
</div>
