# AGENTS.md — powertrackr

SvelteKit 3 + Svelte 5 (runes) + Cloudflare adapter + Drizzle + Valibot. Package manager: `pnpm`.

## Cloudflare bindings

- Since the SvelteKit 3 breaking change, `event.platform` no longer carries Cloudflare APIs. Access bindings via `import { env } from "cloudflare:workers"` — emulated in `vite dev`, native in production. Never read bindings from `event.platform`.
- After `wrangler.toml` changes, regenerate types: `pnpm cf:types`.

## Local dev (`vite dev`)

- Local D1 lives in `.wrangler/state`. After pulling new migrations: `pnpm db:migrate:local`. (`test.db` is vitest-only via `TEST_DATABASE_URL`, never used by the app.)
- `.env` changes require a dev-server restart.

## Imports & aliases

- `#lib/*` → `./src/lib/*`, `#routes/*` → `./src/routes/*` (see `imports` in `package.json`). Always use aliases, never deep relative paths across folders — EXCEPT inside `new URL()` (e.g. `new Worker`), where `#` starts a URL fragment and breaks Vite resolution: use a relative path there.
- Valibot is always `import * as v from "valibot"` — and only inside `src/lib/validators/`.

## Validators (Valibot)

- ALL schemas/fields live in `src/lib/validators/`. Never define `v.object`/`v.pipe`/field schemas inline in `*.remote.ts`, `+page.server.ts`, components, or `src/env.ts` — import them.
- NO `from "valibot"` outside `src/lib/validators/**` (enforced: `grep -rn 'from "valibot"' src | grep -v "src/lib/validators/"` must be empty). Callers that need to parse/validate use helpers exported from the validator module (`parseX` / `isXValid`), never `v.parse`/`v.safeParse` directly.
- One domain file per area (`auth.ts`, `user.ts`, …) plus a shared module `src/lib/validators/shared.ts` for reusable fields. Reuse before duplicating (email, password, id, reading, date, turnstile token, …).
- Exported schema/field consts are `UPPER_SNAKE_CASE`:
  ```ts
  // shared.ts
  export const EMAIL_FIELD = v.pipe(v.string(), v.email());
  export const PASSWORD_FIELD = v.pipe(v.string(), v.minLength(8));
  // auth.ts
  import { EMAIL_FIELD, PASSWORD_FIELD } from "./shared.js";
  export const LOGIN_SCHEMA = v.object({ email: EMAIL_FIELD, password: PASSWORD_FIELD });
  ```
- Re-export every domain file from `src/lib/validators/index.ts`. Import from the domain file (`#lib/validators/auth.js`), not the barrel, in server code.
- Types come from schemas: `export type LoginInput = v.InferOutput<typeof LOGIN_SCHEMA>;` — never hand-duplicate a schema shape as an interface.

## Svelte 5 conventions

- Runes only (`$props`, `$state`, `$derived`, `$derived.by`). No legacy `export let`, no stores where a rune fits.
- Avoid `$effect`: prefer `$derived`/`$derived.by`, event handlers, or `onMount` for true external sync (subscriptions, observers, imperative DOM). Never use `$effect` to compute derivable state or to sync props → local state; if an effect is unavoidable, comment why in one line.
- Script order — imports first, then:
  1. `<script module>`: used/exported types (`Props`, input/output types), shared consts, pure helpers. No runes, no side effects.
  2. `<script>` top, directly below the tag: runes + lifecycle (`$props`, `$state`, `$derived`, `onMount`/`onNavigate`/unavoidable `$effect`, store init).
  3. Middle: functions with side effects (handlers, fetchers, subscriptions).
  4. Bottom: pure local functions and local consts.
- Use the Svelte MCP server when available: `list-sections` first, then `get-documentation` for ALL relevant sections, `svelte-autofixer` until clean on every Svelte edit. Never `playground-link` for project files (only on explicit user request for snippets).

## Quality gate (optimized — no full rebuilds)

- Done = zero errors AND zero warnings in the checks below. Never ship with a warning you introduced.
- Fast first, slow last, each once:
  1. `pnpm lint` (oxlint, fast) — after edits.
  2. `pnpm vitest run <touched-area>` — only the tests covering your change.
  3. `pnpm check` (svelte-check, slow) — ONCE at the end, never after every edit, never `--watch` in agent runs.
- Never run `vite build` / `build:preview` / `wrangler dev` to validate code. No `svelte-kit sync` except as part of `pnpm check`.

## Svelte MCP tools

- `list-sections`: discover docs FIRST on any Svelte/SvelteKit task.
- `get-documentation`: fetch ALL relevant sections (check `use_cases`).
- `svelte-autofixer`: MUST pass with no issues/suggestions before finishing Svelte code.
- `playground-link`: only after user confirmation, never for project files.
