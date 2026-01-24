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
    // threads isn't listed in the InlineConfig type for this version of Vitest,
    // but it's supported at runtime and used here to ensure tests run in a
    // single process to avoid flaky DB interactions.
    // @ts-expect-error runtime-only config option
    threads: false,
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
