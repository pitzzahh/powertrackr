<script lang="ts">
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { registerFormSchema, type RegisterFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';

	const options: FormOptions<RegisterFormSchema> = {
		onSubmit() {
			toast.info('Submitting...');
		},
		onResult({ result }) {
			if (result.status === 302) toast.success('Registered Successfully!');
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
		}
	};
	export let data: PageData;
</script>

<svelte:head>
	<title>PowerTrackr Registration</title>
</svelte:head>

<div class="container md:w-1/2">
	<h2>Register</h2>
	<Form.Root method="POST" form={data.form} {options} schema={registerFormSchema} let:config>
		<Form.Field {config} name="name">
			<Form.Item>
				<Form.Label>Name</Form.Label>
				<Form.Input />
				<Form.Description>This is your public display name.</Form.Description>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="username">
			<Form.Item>
				<Form.Label>Username</Form.Label>
				<Form.Input />
				<Form.Description>This is your public display username.</Form.Description>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="password">
			<Form.Item>
				<Form.Label>Password</Form.Label>
				<Form.Input />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="confirmPassword">
			<Form.Item>
				<Form.Label>ConfirmPassword</Form.Label>
				<Form.Input />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Button>Register</Form.Button>
	</Form.Root>
	<p>
		Already have an account? <a
			href="login"
			class="hover:text-primary hover:underline hover:underline-offset-4">login</a
		>
	</p>
</div>
