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
            event.locals.auth.setSession(await auth.createSession({
                userId: key.userId,
                attributes: {}
            }));
        } catch (e: any) {
            if (e instanceof LuciaError) {
                if(e.message === 'AUTH_INVALID_KEY_ID') {
                    return fail(400, {
                        message: 'Username not found',
                        form: loginForm
                    });
                }
                else if(e.message === 'AUTH_INVALID_PASSWORD') {
                    return fail(400, {
                        message: 'Incorrect password',
                        form: loginForm
                    });
                } else {
                    return fail(500, {
                        message: e.message,
                        form: loginForm
                    });
                }
            }
            console.error(`Login Error: ${JSON.stringify(e)}`)
            return fail(500, {
                message: 'An unknown error occurred',
                form: loginForm
            });
        }

        throw redirect(302, '/');
    }
};