import type { Session } from 'lucia';
import type { LayoutServerLoad } from './$types';
import { prismaClient } from '$lib/server/prisma';

export const load = (async ({ locals }) => {
    const session: Session = await locals.auth.validate()
    if (session) {
        const user = await prismaClient.user.findUnique({
            where: {
                id: session.user.userId
            },
            include: {
                billing_info: true
            }
        });
        console.info(`User: ${JSON.stringify(user)}`);
        return {
            user
        }
    }
}) satisfies LayoutServerLoad;