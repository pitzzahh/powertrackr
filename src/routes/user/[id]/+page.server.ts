import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { prismaClient } from '$lib/server/prisma';
import { superValidate } from 'sveltekit-superforms/server';
import { profileFormSchema } from '$lib/config/formSchema';
import type { PageServerLoad, RouteParams, Actions } from './$types';
import { no_access_permission } from '$paraglide/messages';

export const load = (async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) redirect(302, '/auth/login');

	const user = await prismaClient.user.findUnique({
		where: {
			username: params.id
		}
	});

	if (!user || user.id !== session.user.userId) {
		error(403, no_access_permission());
	}

	return {
		form: await superValidate(profileFormSchema)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event: RequestEvent<RouteParams, '/user/[id]'>) => {
		const form = await superValidate(event, profileFormSchema);
		console.log(`Profile form: ${JSON.stringify(form, null, 2)}`);
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const { avatar } = form.data;
		console.log(`avatar: `, JSON.stringify(avatar));

		// idk why but the avatar is coming as 'undefined' string from the form data
		if (avatar !== 'undefined') {
			const res = await prismaClient.user.update({
				where: {
					username: event.params.id
				},
				data: {
					picture: avatar
				}
			});
			console.log(`Updated user: `, JSON.stringify(res, null, 2));
		}

		return {
			form
		};
	}
};
