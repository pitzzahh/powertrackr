import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({locals}) => {
	const session = await locals.auth.validate();
	if (!session) redirect(302, '/auth/login');
}) satisfies PageServerLoad;
