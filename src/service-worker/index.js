// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { self } from "$app/service-worker";
import { version } from "$app/env";
import { immutable, assets } from "$app/manifest";
import { resolve } from "$app/paths";

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// `immutable`/`assets` paths from `$app/manifest` are relative to the base
// path, so resolve them to absolute pathnames that can be matched against
// `url.pathname` in the `fetch` handler. `resolve` is literal-typed for route
// pathnames, so cast the manifest paths (any string is valid at runtime).
/** @type {string[]} */
const ASSETS = [
  ...immutable.map(({ path }) => resolve(/** @type {any} */ (path))), // the app itself
  ...assets.map(({ path }) => resolve(/** @type {any} */ (path))), // everything in `static`
];

self.addEventListener("install", (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener("activate", (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
  // ignore POST requests etc
  if (event.request.method !== "GET") return;

  // never intercept WebSocket upgrades (e.g. Vite HMR in dev)
  if (event.request.headers.get("upgrade") === "websocket") return;

  async function respond() {
    const url = new URL(event.request.url);

    // Exclude unsupported schemes (like chrome-extension, moz-extension)
    if (url.protocol === "chrome-extension:" || url.protocol === "moz-extension:") {
      return fetch(event.request);
    }

    const cache = await caches.open(CACHE);

    // `immutable`/`assets` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);

      if (response) {
        return response;
      }
    }

    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      const response = await fetch(event.request);

      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        throw new Error("invalid response from fetch");
      }

      // cache successful responses, but never streaming/no-store ones
      // (e.g. remote live queries) — caching those breaks the stream
      if (response.status === 200 && !response.headers.get("cache-control")?.includes("no-store")) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (err) {
      const response = await cache.match(event.request);

      if (response) {
        return response;
      }

      // if there's no cache, then just error out
      // as there is nothing we can do to respond to this request
      throw err;
    }
  }

  event.respondWith(respond());
});
