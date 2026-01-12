import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    environment: "node",
    globals: true,
    setupFiles: ["src/lib/server/crud/__tests__/helpers/setup.ts"],
    pool: "forks",
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    fileParallelism: false,
    sequence: {
      hooks: "stack",
    },
  },
  resolve: {
    alias: {
      $: "/src/lib",
      "$env/static/private": "/src/lib/server/crud/__tests__/helpers/mock-env.ts",
    },
  },
});
