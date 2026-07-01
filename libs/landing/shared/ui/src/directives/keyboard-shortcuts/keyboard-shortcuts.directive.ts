import { Directive, inject } from '@angular/core';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';

/**
 * Mounts the global `keydown` listener for the {@link KeyboardShortcutService}.
 *
 * Apply once at the app root (typically on `landing-shell`):
 *
 * ```html
 * <div fxKeyboardShortcuts>
 *   <landing-header />
 *   <main>...</main>
 * </div>
 * ```
 */
@Directive({
  selector: '[fxKeyboardShortcuts]',
  standalone: true,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class KeyboardShortcutsDirective {
  private readonly shortcuts = inject(KeyboardShortcutService);

  protected onKeydown(event: KeyboardEvent): void {
    this.shortcuts.handleKeydown(event);
  }
}
