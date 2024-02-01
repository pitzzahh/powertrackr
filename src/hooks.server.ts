import { auth } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { i18n } from "$lib/i18n"

export const handleLucia: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};

export const handleI18n = i18n.handle()

export const handle: Handle = sequence(handleI18n, handleLucia);