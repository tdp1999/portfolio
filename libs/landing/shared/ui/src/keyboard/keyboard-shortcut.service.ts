import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { comboFromEvent, formatCombo, normalizeCombo, type KeyboardShortcut } from './keyboard-shortcut.types';
import { isInEditableElement } from './keyboard-shortcut.util';

/**
 * Root-provided registry of global keyboard shortcuts.
 *
 * **Usage**
 *
 * Register from any component / service:
 * ```ts
 * const shortcuts = inject(KeyboardShortcutService);
 * const dispose = shortcuts.register({
 *   id: 'theme-toggle',
 *   description: 'Toggle theme',
 *   keys: ['mod+shift+l'],
 *   category: 'Appearance',
 *   iconName: 'sun',
 *   handler: () => this.theme.toggle(),
 * });
 * // Later (e.g., on destroy): dispose();
 * ```
 *
 * Mount the global listener once at app root (e.g. on `landing-shell`):
 * ```html
 * <div fxKeyboardShortcuts>...</div>
 * ```
 *
 * **Suspending**
 *
 * Modals / palettes that intercept keys can call `suspend()` while open so global
 * shortcuts don't fire underneath. The returned disposer must be called on close.
 * `suspend()` is reference-counted — global shortcuts only resume when every caller
 * has disposed.
 *
 * **Behavior in editable fields**
 *
 * By default, shortcuts are skipped when focus is in an `<input>`, `<textarea>`,
 * `<select>`, or contenteditable element. Pass `allowInInput: true` on the
 * shortcut to bypass that guard (used by ⌘K palette opener).
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly shortcuts = signal<readonly KeyboardShortcut[]>([]);
  private readonly suspendedCount = signal(0);
  private readonly isMacSignal = signal<boolean>(false);

  /** Public, read-only view of all currently registered shortcuts. */
  readonly all = this.shortcuts.asReadonly();
  readonly suspended = computed(() => this.suspendedCount() > 0);
  readonly isMac = this.isMacSignal.asReadonly();

  constructor() {
    if (this.isBrowser) {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      this.isMacSignal.set(/Mac|iPhone|iPad|iPod/.test(ua));
    }
  }

  /**
   * Register a shortcut. Returns a disposer that unregisters it.
   * Re-registering with the same `id` replaces the prior entry.
   */
  register(shortcut: KeyboardShortcut): () => void {
    this.shortcuts.update((arr) => {
      const filtered = arr.filter((s) => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
    return () => this.unregister(shortcut.id);
  }

  unregister(id: string): void {
    this.shortcuts.update((arr) => arr.filter((s) => s.id !== id));
  }

  /**
   * Suspend dispatching. Returns a resume function. Suspends are ref-counted —
   * shortcuts only resume after every suspend disposer has been called.
   */
  suspend(): () => void {
    this.suspendedCount.update((c) => c + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.suspendedCount.update((c) => Math.max(0, c - 1));
    };
  }

  /**
   * Called by the global directive on every `keydown`. Returns true if a shortcut
   * was matched and dispatched (caller should consider the event handled).
   */
  handleKeydown(event: KeyboardEvent): boolean {
    if (this.suspended()) return false;
    const inEditable = isInEditableElement(event.target);
    const combo = comboFromEvent(event);
    for (const shortcut of this.shortcuts()) {
      if (inEditable && !shortcut.allowInInput) continue;
      const match = shortcut.keys.some((k) => normalizeCombo(k) === combo);
      if (match) {
        event.preventDefault();
        // Stop the same event from being seen by other document:keydown
        // listeners (e.g. the command palette's internal listener, which
        // otherwise would catch the same ⌘K and immediately re-toggle).
        event.stopImmediatePropagation();
        try {
          shortcut.handler();
        } catch (err) {
          // Don't let a handler error tear down the listener — log + move on.
          console.error('[keyboard-shortcut] handler failed for', shortcut.id, err);
        }
        return true;
      }
    }
    return false;
  }

  /** Pretty-print a combo using the platform's modifier glyphs. */
  format(combo: string): string {
    return formatCombo(combo, this.isMacSignal());
  }
}
