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
    csp: {
      mode: "nonce",
      directives: {
        "default-src": ["self"],
        "script-src": [
          "self",
          "sha256-uQ+6xeJ5jfvD5SmN5W7ZFR4dF9DbDwscZWrWOLfV+RM=",
          "sha256-94WxU203ItVdYeuHa4UBPQzWANAxvaHV/BgTnRrE/14=",
          "nonce-RrxeVQDI4LnE62R05ozHjg==",
        ],
        "worker-src": ["self", "blob:"],
        "style-src": ["self", "unsafe-inline", "https://fonts.googleapis.com"],
        "img-src": ["self", "data:"],
        "font-src": ["self", "https://fonts.gstatic.com"],
        "connect-src": ["self"],
      },
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
