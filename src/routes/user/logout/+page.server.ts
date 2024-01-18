import { auth } from '$lib/server/lucia';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    console.log('logging out');
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/');
    await auth.invalidateSession(session.sessionId);
    locals.auth.setSession(null);
    throw redirect(302, '/');
}) satisfies PageServerLoad;

