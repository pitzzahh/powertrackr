import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prismaClient } from '$lib/server/prisma';
import { no_access_permission } from '$paraglide/messages';

export const load = (async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) redirect(302, '/auth/login');
	const user = await prismaClient.user.findUnique({
		where: {
			username: session.user.username
		}
	});

	if (!user || user.id !== session.user.userId) {
		console.error('User not found or not logged in as user');
		error(403, no_access_permission());
	}
}) satisfies PageServerLoad;