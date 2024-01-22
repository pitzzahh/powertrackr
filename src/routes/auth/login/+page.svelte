<script lang="ts">
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { loginFormSchema, type LoginFormSchema } from '$lib/config/formSchema';
	import { toast } from 'svelte-sonner';
	import type { FormOptions } from 'formsnap';

	const options: FormOptions<LoginFormSchema> = {
		onSubmit() {
			toast.info('Logging in...');
		},
		onResult({ result }) {
			if (result.status === 302) toast.success('Logged-in successfully!');
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
				<Form.Input />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Button>Login</Form.Button>
	</Form.Root>
    <p>Don't have an account? <a href="register" class="hover:text-primary hover:underline hover:underline-offset-4">register</a></p>
</div>
