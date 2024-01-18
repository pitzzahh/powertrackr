import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const auth = await locals.auth.validate()
    if (auth) {
        const { user, session } = auth
        console.log(`Session: ${session}`)
        return {
            user
        }
    }
}) satisfies LayoutServerLoad;