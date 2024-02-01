import type { LayoutServerLoad } from './$types';

export const load = (async ({parent}) => {
	return {
		user: (await parent()).user
	};
}) satisfies LayoutServerLoad;
