import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { loginFormSchema } from '$lib/config/formSchema';
import { auth } from '$lib/server/lucia';
import { LuciaError } from 'lucia';

export const load = (async ({ locals }) => {
    const session = await locals.auth.validate();
    if (session) throw redirect(302, '/');
    return {
        form: await superValidate(loginFormSchema)
    }
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const loginForm = await superValidate(event, loginFormSchema);
        if (!loginForm.valid) {
            return fail(400, {
                form: loginForm
            });
        }

        const { username, password } = loginForm.data;

        try {
            const key = await auth.useKey('username', username.toLowerCase(), password);
            const session = await auth.createSession({
                userId: key.userId,
                attributes: {}
            });
            event.locals.auth.setSession(session);
        } catch (e: any) {
            if (
                e instanceof LuciaError &&
                (e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
            ) {
                return fail(400, {
                    message: 'Incorrect username or password',
                    form: loginForm
                });
            }
            return fail(500, {
                message: 'An unknown error occurred',
                form: loginForm
            });
        }

        throw redirect(302, '/');
    }
};