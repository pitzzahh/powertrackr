import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RouteParams } from './$types';
import { prismaClient } from '$lib/server/prisma';
import {
	CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET
} from '$env/static/private';
import { v2 as cloudinary } from 'cloudinary';
import { superValidate } from 'sveltekit-superforms/server';
import { profileFormSchema } from '$lib/config/formSchema';

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
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event: RequestEvent<RouteParams, "/user/[id]">) => {
		const form = await superValidate(event, profileFormSchema);
		console.log(`Profile form: ${JSON.stringify(form, null, 2)}`);
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const { avatar } = form.data

		console.log(`avatar: ${JSON.stringify(avatar, null, 2)}`)

		if (avatar) {
			cloudinary.config({
				cloud_name: CLOUDINARY_CLOUD_NAME,
				api_key: CLOUDINARY_API_KEY,
				api_secret: CLOUDINARY_API_SECRET,
				secure: true
			});
			// TODO: Upload user profile pic to cloudinary
			const result = await cloudinary.uploader.upload(avatar);
			console.log(`Cloudinary result: ${JSON.stringify(result, null, 2)}`);
		}

		return {
			form
		};
	}
};
