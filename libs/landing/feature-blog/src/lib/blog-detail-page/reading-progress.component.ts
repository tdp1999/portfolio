import { Component, ElementRef, HostListener, Input, signal } from '@angular/core';

@Component({
  selector: 'landing-reading-progress',
  template: `<div class="reading-progress" [style.transform]="'scaleX(' + progress() + ')'"></div>`,
  styles: [
    `
      .reading-progress {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--color-primary, #6366f1);
        transform-origin: left;
        z-index: 100;
        transition: transform 0.05s linear;
        pointer-events: none;
      }
    `,
  ],
})
export class ReadingProgressComponent {
  @Input() target: HTMLElement | null = null;
  progress = signal(0);

  @HostListener('window:scroll')
  onScroll() {
    const el = this.target;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) {
      this.progress.set(1);
      return;
    }
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    this.progress.set(scrolled / total);
  }
}
