import { Injectable, signal } from '@angular/core';

/**
 * Programmatic control of the command palette.
 *
 * The palette component subscribes to `visible` and renders itself when true.
 * Anywhere in the app can call `show()` / `hide()` / `toggle()`.
 *
 * The ⌘K shortcut is registered by the palette component itself (via
 * `KeyboardShortcutService`) — callers don't need to wire it.
 */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly visibleSignal = signal(false);
  readonly visible = this.visibleSignal.asReadonly();

  show(): void {
    this.visibleSignal.set(true);
  }

  hide(): void {
    this.visibleSignal.set(false);
  }

  toggle(): void {
    this.visibleSignal.update((v) => !v);
  }
}
