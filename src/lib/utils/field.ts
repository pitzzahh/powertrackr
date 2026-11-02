/**
 * Adapts a SvelteKit remote-form `.as()` spread (or any input prop bag) to the
 * UI `Input`, which takes `value: string` and has no `defaultValue`.
 * Non-null values stringify; `defaultValue` is dropped (no form here uses
 * `reset()`, the only thing it affects).
 */
export function fieldInputProps<T extends { value?: unknown; defaultValue?: unknown }>(
  props: T
): Omit<T, "value" | "defaultValue"> & { value: string } {
  const out = { ...(props as Record<string, unknown>) };
  out.value = out.value == null ? "" : String(out.value);
  delete out.defaultValue;
  return out as Omit<T, "value" | "defaultValue"> & { value: string };
}
