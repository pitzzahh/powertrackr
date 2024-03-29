import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { registerFormSchema } from '$lib/config/formSchema';
import { auth } from '$lib/server/lucia';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { defaultUserAvatars } from '$lib/assets/default-user-avatar';
import { username_taken, unknown_error } from '$paraglide/messages';

export const load = (async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) redirect(302, '/');
	return {
		form: await superValidate(registerFormSchema)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const registrationForm = await superValidate(event, registerFormSchema);
		if (!registrationForm.valid) {
			return fail(400, {
				form: registrationForm
			});
		}

		const { name, username, password } = registrationForm.data;

		try {
			const request = await event.fetch(`https://api.genderize.io/?name=${name.split(' ')[0]}`);

			const res = await request.json();

			const filteredAvatars = defaultUserAvatars.filter((a) =>
				a.id.startsWith(res.gender.toLowerCase())
			);

			await auth.createUser({
				key: {
					providerId: 'username',
					providerUserId: username,
					password
				},
				attributes: {
					name,
					username,
					picture: filteredAvatars
						? filteredAvatars[Math.floor(Math.random() * filteredAvatars.length)].id
						: null
				}
			});
		} catch (e: any) {
			// check for unique constraint error in user table
			console.error(`e: ${JSON.stringify(e)}`);
			if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
				return fail(400, {
					message: username_taken(),
					form: registrationForm
				});
			}
			return fail(500, {
				message: unknown_error(),
				form: registrationForm
			});
		}
		redirect(301, '/auth/login');
	}
};
