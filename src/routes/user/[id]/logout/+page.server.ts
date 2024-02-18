import { auth } from '$lib/server/lucia';
import { redirect, error } from '@sveltejs/kit';
import { prismaClient } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { no_action_permission} from '$paraglide/messages'

export const load = (async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) redirect(302, '/auth/login');
	const user = await prismaClient.user.findUnique({
		where: {
			username: params.id
		}
	});

	if (!user || user.id !== session.user.userId) {
		console.error('User not found or not logged in as user');
		error(403, no_action_permission());
	}
	await auth.invalidateSession(session.sessionId);
	locals.auth.setSession(null);
	redirect(301, '/');
}) satisfies PageServerLoad;
