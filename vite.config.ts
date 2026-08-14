import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { enhancedImages } from "@sveltejs/enhanced-img";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    enhancedImages(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({
        fallback: "plaintext",
      }),
      experimental: {
        remoteFunctions: true,
      },
      csp: {
        mode: "auto",
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
