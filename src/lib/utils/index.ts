/**
 * Return true if the event target (or its ancestor) is an editable control:
 * - input, textarea, select
 * - any element with contenteditable
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target) return false;

  // If the target is an element, use it; otherwise try to find a parent element.
  let el: Element | null = null;
  if (target instanceof Element) {
    el = target;
  } else if (target instanceof Node && target.parentElement) {
    el = target.parentElement;
  }

  if (!el) return false;

  // If any ancestor matches common editable controls, treat as editable.
  try {
    if (el.closest && el.closest("input, textarea, select, [contenteditable]")) return true;
  } catch {
    // Ignore any potential errors from closest in odd environments.
  }

  // Fallback checks.
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  // isContentEditable is supported on HTMLElement
  if ("isContentEditable" in el && (el as HTMLElement).isContentEditable) return true;

  return false;
}
