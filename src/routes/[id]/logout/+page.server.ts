import { auth } from '$lib/server/lucia';
import { redirect, error } from '@sveltejs/kit';
import { prismaClient } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
    console.log('logging out');
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/');
    const user = await prismaClient.user.findUnique({
        where: {
            username: params.id
        }
    });

    if (!user || user.id !== session.user.userId) {
        console.error('User not found or not logged in as user');
        error(403, 'You do not have permission to do that');
    }

    await auth.invalidateSession(session.sessionId);
    locals.auth.setSession(null);
    console.log('logged out');
    redirect(302, '/');
}) satisfies PageServerLoad;

