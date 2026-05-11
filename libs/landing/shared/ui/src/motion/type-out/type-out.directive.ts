import { isPlatformBrowser } from '@angular/common';
import { Directive, effect, ElementRef, inject, input, OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * Type-out text reveal. Watches `text` and animates the host's `textContent`
 * from empty → full text, one character per `charDelay` ms.
 *
 * - SSR / first render: writes the full text immediately (no animation).
 * - Subsequent `text` changes in the browser: animate the reveal.
 * - `prefers-reduced-motion`: skip animation, write the text immediately.
 *
 * While animating, the host gains class `fx-type-out--animating` so a caret
 * (via CSS pseudo-element) can blink alongside.
 *
 * Usage:
 *   <span fxTypeOut [text]="value()" [charDelay]="36"></span>
 */
@Directive({
  selector: '[fxTypeOut]',
  standalone: true,
  host: { class: 'fx-type-out' },
})
export class TypeOutDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly text = input.required<string>();
  /** Per-character delay in ms. Default 36ms. */
  readonly charDelay = input<number>(36);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private firstRun = true;

  constructor() {
    effect(() => {
      const next = this.text();
      this.render(next);
    });
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  private render(text: string): void {
    const host = this.el.nativeElement;

    if (!isPlatformBrowser(this.platformId)) {
      host.textContent = text;
      return;
    }

    // First synchronous render in the browser — set immediately, no animation.
    // Lets server-rendered HTML hydrate without a flicker.
    if (this.firstRun) {
      this.firstRun = false;
      host.textContent = text;
      return;
    }

    if (this.prefersReducedMotion()) {
      this.cancel();
      host.textContent = text;
      return;
    }

    this.cancel();
    let i = 0;
    host.textContent = '';
    host.classList.add('fx-type-out--animating');
    const delay = this.charDelay();

    const tick = (): void => {
      if (i <= text.length) {
        host.textContent = text.slice(0, i);
        i++;
        this.timer = setTimeout(tick, delay);
      } else {
        host.classList.remove('fx-type-out--animating');
        this.timer = null;
      }
    };

    tick();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.el.nativeElement.classList.remove('fx-type-out--animating');
  }
}
