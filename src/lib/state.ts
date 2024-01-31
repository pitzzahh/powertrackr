import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { State } from '$lib/types';

export const MAIN_STATE_CTX = 'MAIN_STATE_CTX';

export const setState = (initialData: State, context: string) => {
	const state = writable<State>(initialData);
	setContext(MAIN_STATE_CTX, state);
	return state;
};

export const getState = (context: string) => {
    return getContext<Writable<State>>(context);
}