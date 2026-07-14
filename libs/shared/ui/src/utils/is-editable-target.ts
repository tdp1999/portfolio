/**
 * True when an event target is a text field or rich-text editor — an element
 * that owns typing. Global keyboard shortcuts should yield to it: chords like
 * Cmd/Ctrl+B mean "bold" inside an editor, not "toggle sidebar".
 *
 * `isContentEditable` is inherited, so this also matches descendants of a
 * contenteditable root (e.g. any node inside a ProseMirror editable region).
 *
 * Single source of truth for the "am I typing?" guard across the app.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
