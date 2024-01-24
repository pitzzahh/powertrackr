import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ssr:{
	noExternal:['chart.js'],
	},
	plugins: [sveltekit()]
});
