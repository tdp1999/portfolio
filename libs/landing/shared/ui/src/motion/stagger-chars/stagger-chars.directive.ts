import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, PLATFORM_ID, inject, input } from '@angular/core';

const PSEUDO_RANDOM_OFFSETS = [-4, 6, -2, 5, -6, 3, 0, 4, -5, 2, -3, -1, 5, -4, 6, -2, 3, -5, 4, -2];

/**
 * Per-character entrance animation. Splits the host's text content into
 * individual `<span class="fx-stagger-chars__char">` elements on hydration
 * and each animates from a small randomized Y offset → settled, opacity
 * 0 → 1, with a stagger between characters.
 *
 * Pure-CSS animation; the directive only handles the DOM split and per-span
 * variable wiring. Reduced-motion safe (CSS).
 */
@Directive({
  selector: '[fxStaggerChars]',
  standalone: true,
  host: { class: 'fx-stagger-chars' },
})
export class StaggerCharsDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Delay between consecutive characters, in ms. Default 22ms. */
  readonly charDelay = input<number>(22);
  /** Animation duration per character, in ms. Default 520ms. */
  readonly duration = input<number>(520);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => this.split());
  }

  private split(): void {
    const host = this.el.nativeElement;
    const text = (host.textContent ?? '').trim();
    if (!text) return;

    host.textContent = '';
    const chars = [...text];
    const charDelay = this.charDelay();
    const duration = this.duration();

    chars.forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'fx-stagger-chars__char';
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.setProperty('--fx-i', String(i));
      span.style.setProperty('--fx-y', String(PSEUDO_RANDOM_OFFSETS[i % PSEUDO_RANDOM_OFFSETS.length]));
      span.style.animationDuration = `${duration}ms`;
      span.style.animationDelay = `${i * charDelay}ms`;
      host.appendChild(span);
    });

    host.classList.add('fx-stagger-chars--ready');
  }
}
