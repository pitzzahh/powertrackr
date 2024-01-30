import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { State } from '$lib/types';

const STATE_CTX = 'STATE_CTX';

export const setState = (initialData: State) => {
	const state = writable<State>(initialData);
	setContext(STATE_CTX, state);
	return state;
};

export const getState = () => {
    return getContext<Writable<State>>(STATE_CTX);
}