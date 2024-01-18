import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { registerFormSchema } from '$lib/config/formSchema';
import { auth } from '$lib/server/lucia';

export const load = (async ({ locals }) => {
    const session = await locals.auth.validate();
    if (session) throw redirect(302, '/');
    return {
        form: await superValidate(registerFormSchema)
    }
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const registrationForm = await superValidate(event, registerFormSchema);
        if (!registrationForm.valid) {
            return fail(400, {
                form: registrationForm
            });
        }
        
        const { name, username, password } = registrationForm.data;

        try {
            await auth.createUser({
                key: {
                    providerId: 'username',
                    providerUserId: username,
                    password
                },
                attributes: {
                    name,
                    username
                }
            })
		} catch (e: any) {
			// check for unique constraint error in user table
            console.log(`e: ${JSON.stringify(e)}`)
			if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return fail(400, {
					message: 'Username already taken',
                    form: registrationForm
				});
			}
			return fail(500, {
				message: 'An unknown error occurred',
                form: registrationForm
			});
		}
        throw redirect(302, '/auth/login');
    }
};