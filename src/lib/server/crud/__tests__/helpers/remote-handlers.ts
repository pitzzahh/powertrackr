// Helpers for calling `*.remote.ts` handlers directly in tests. Pair with a
// `vi.mock("$app/server", () => remoteServerMock(getEvent))` in the test file.

type Locals = { user: App.Locals["user"]; session: App.Locals["session"] };

/**
 * `form`/`command` hand back the handler itself; queries become inert stubs.
 * Each result carries the `__.type` tag SvelteKit checks on every
 * `*.remote.ts` export.
 */
export function remoteServerMock(getEvent: () => unknown) {
  const tag = <T extends object>(fn: T, type: string) => Object.assign(fn, { __: { type } });
  return {
    form: (...args: unknown[]) => tag(args.at(-1) as object, "form"),
    command: (...args: unknown[]) => tag(args.at(-1) as object, "command"),
    query: () => tag(() => ({ refresh: async () => {} }), "query"),
    getRequestEvent: getEvent,
  };
}

/** The `issues` argument of a remote form: `issues.field(msg)` builds an issue. */
export const issues = new Proxy(
  {},
  { get: (_, field) => (message: string) => ({ path: [field], message }) }
) as Record<string, (message: string) => { path: string[]; message: string }>;

export function makeEvent(locals: Locals) {
  return {
    locals,
    url: new URL("http://localhost/"),
    request: new Request("http://localhost/"),
    getClientAddress: () => "127.0.0.1",
    cookies: { get: () => undefined, set: () => {}, delete: () => {} },
  };
}
