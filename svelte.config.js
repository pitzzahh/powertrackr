import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    alias: {
      "$/*": "./src/lib/*",
      "$routes/*": "./src/routes/*",
    },
    experimental: {
      remoteFunctions: true,
    },
    adapter: adapter({
      precompress: true,
    }),
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
