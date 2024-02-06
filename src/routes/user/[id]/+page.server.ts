import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { prismaClient } from '$lib/server/prisma';
import { superValidate } from 'sveltekit-superforms/server';
import { profileFormSchema } from '$lib/config/formSchema';
import type { PageServerLoad, RouteParams, Actions } from './$types';

export const load = (async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) redirect(302, '/auth/login');

	const user = await prismaClient.user.findUnique({
		where: {
			username: params.id
		}
	});

	if (!user || user.id !== session.user.userId) {
		error(403, 'You do not have permission to access that page');
	}

	return {
		form: await superValidate(profileFormSchema)
	}
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
		if (avatar) {
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
