import adapter from "@sveltejs/adapter-cloudflare";
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
      fallback: "plaintext",
    }),
    output: {
      bundleStrategy: "single",
    },
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
