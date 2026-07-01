/**
 * A keyboard shortcut registration.
 *
 * Combos use `+`-separated tokens, case-insensitive. Recognized modifiers:
 * - `mod` — `Cmd` on macOS / `Ctrl` elsewhere (recommended for portable shortcuts)
 * - `ctrl`, `cmd`, `meta` — aliases for `mod`
 * - `shift`
 * - `alt`, `option`
 *
 * The non-modifier part is matched against `event.key.toLowerCase()`, so any
 * printable character or named key (`escape`, `arrowdown`, etc.) works.
 *
 * Examples: `mod+k`, `mod+shift+l`, `mod+/`, `alt+enter`.
 */
export interface KeyboardShortcut {
  /** Stable id (also used as the registration key — re-registering replaces). */
  readonly id: string;
  /** Short description shown in the command palette and tooltips. */
  readonly description: string;
  /** One or more combos that trigger the shortcut. First combo is the "primary" displayed. */
  readonly keys: readonly string[];
  /** Lucide icon name for palette display. */
  readonly iconName?: string;
  /** Category bucket — e.g. 'Theme', 'Navigation', 'Language'. Used by palette grouping. */
  readonly category?: string;
  /** When true, the shortcut fires even when focus is in an `<input>` / `<textarea>` / contenteditable. Default false. */
  readonly allowInInput?: boolean;
  /** Handler invoked when matched. */
  readonly handler: () => void;
}

/** Normalize a combo string to its canonical form (`mod+shift+k`). */
export function normalizeCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  const modifierSet = new Set<string>();
  let mainKey = '';
  for (const p of parts) {
    if (p === 'mod' || p === 'ctrl' || p === 'cmd' || p === 'meta') modifierSet.add('mod');
    else if (p === 'shift') modifierSet.add('shift');
    else if (p === 'alt' || p === 'option') modifierSet.add('alt');
    else mainKey = p;
  }
  const order = ['mod', 'shift', 'alt'];
  const sortedMods = order.filter((m) => modifierSet.has(m));
  return [...sortedMods, mainKey].join('+');
}

/** Build a combo string from a `KeyboardEvent`. */
export function comboFromEvent(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

/** Pretty-print a combo for display: `mod+shift+k` → `⌘ ⇧ K` (mac) / `Ctrl Shift K` (other). */
export function formatCombo(combo: string, isMac: boolean): string {
  return normalizeCombo(combo)
    .split('+')
    .map((p) => {
      if (p === 'mod') return isMac ? '⌘' : 'Ctrl';
      if (p === 'shift') return isMac ? '⇧' : 'Shift';
      if (p === 'alt') return isMac ? '⌥' : 'Alt';
      if (p === 'enter') return isMac ? '↵' : 'Enter';
      if (p === 'escape') return 'Esc';
      if (p === 'arrowup') return '↑';
      if (p === 'arrowdown') return '↓';
      if (p === 'arrowleft') return '←';
      if (p === 'arrowright') return '→';
      return p.length === 1 ? p.toUpperCase() : p;
    })
    .join(isMac ? ' ' : '+');
}
