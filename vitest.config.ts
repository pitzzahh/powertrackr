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
    // On CI environments tests can be slower (DB setup, network, shared runners).
    // Increase timeouts when running in CI to reduce spurious failures.
    testTimeout: process.env.CI ? 120000 : 20000,
    hookTimeout: process.env.CI ? 60000 : 20000,
    teardownTimeout: process.env.CI ? 60000 : 5000,
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
