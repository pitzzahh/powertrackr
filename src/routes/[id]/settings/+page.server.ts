import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prismaClient } from '$lib/server/prisma';

export const load = (async ({ locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/auth/login');

    const user = await prismaClient.user.findUnique({
        where: {
            username: params.id
        }
    });

    if (!user || user.id !== session.user.userId) {
        console.error('User not found or not logged in as user');
        throw error(403, 'You do not have permission to access that page');
    }

}) satisfies PageServerLoad;