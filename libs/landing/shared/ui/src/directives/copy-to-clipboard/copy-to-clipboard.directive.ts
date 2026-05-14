import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Directive, inject, input, OnDestroy, PLATFORM_ID, signal } from '@angular/core';

export type CopyState = 'idle' | 'copied' | 'error';

/**
 * Copy a piece of text to the clipboard on click, with a self-resetting state
 * signal consumers can read to swap an icon, show a label, etc.
 *
 * Usage:
 *   <button
 *     [landingCopyToClipboard]="email()"
 *     #copy="landingCopyToClipboard"
 *     [attr.aria-label]="'Copy ' + email()"
 *   >
 *     {{ email() }}
 *     @if (copy.state() === 'copied') {
 *       <landing-icon name="check" />
 *     } @else {
 *       <landing-icon name="copy" />
 *     }
 *   </button>
 *
 * `state()` transitions: idle → copied → (resetMs later) → idle.
 * On clipboard failure, transitions: idle → error → idle.
 * SSR-safe (no-ops on server). Honors keyboard activation when the host is
 * a native `<button>` (browsers fire `click` on Enter/Space).
 */
@Directive({
  selector: '[landingCopyToClipboard]',
  standalone: true,
  exportAs: 'landingCopyToClipboard',
  host: {
    '(click)': 'onClick()',
  },
})
export class CopyToClipboardDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /** Text to copy on click. Bound via the directive selector attribute. */
  readonly text = input.required<string>({ alias: 'landingCopyToClipboard' });
  /** ms to keep the 'copied' state before resetting. Default 1500. */
  readonly resetMs = input<number>(1500);

  readonly state = signal<CopyState>('idle');
  private timer: ReturnType<typeof setTimeout> | null = null;

  async onClick(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = this.text();
    if (!target) return;

    const nav = this.document.defaultView?.navigator;
    if (!nav?.clipboard) {
      this.flash('error');
      return;
    }

    try {
      await nav.clipboard.writeText(target);
      this.flash('copied');
    } catch {
      this.flash('error');
    }
  }

  private flash(next: Exclude<CopyState, 'idle'>): void {
    this.state.set(next);
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.state.set('idle');
      this.timer = null;
    }, this.resetMs());
  }

  ngOnDestroy(): void {
    if (this.timer !== null) clearTimeout(this.timer);
  }
}
