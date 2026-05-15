import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  signal,
} from '@angular/core';
import type { TocEntry } from '@portfolio/landing/shared/data-access';

@Component({
  selector: 'landing-toc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (entries().length > 0) {
      <nav class="toc">
        <p class="toc__title">On this page</p>
        <ul>
          @for (entry of entries(); track entry.id) {
            <li [class.toc__item--h3]="entry.level === 3" [class.toc__item--active]="activeId() === entry.id">
              <a [href]="'#' + entry.id">{{ entry.text }}</a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: [
    `
      .toc {
        font-size: 0.875rem;
        max-height: calc(100vh - 8rem);
        overflow-y: auto;
      }
      .toc__title {
        font-weight: 600;
        margin-bottom: 0.75rem;
        color: var(--landing-text);
      }
      .toc ul {
        list-style: none;
        padding: 0;
        margin: 0;
        border-left: 2px solid var(--landing-border);
      }
      .toc li {
        padding: 0.25rem 0 0.25rem 0.75rem;
        border-left: 2px solid transparent;
        margin-left: -2px;
      }
      .toc li.toc__item--h3 {
        padding-left: 1.5rem;
      }
      .toc li.toc__item--active {
        border-left-color: var(--landing-accent);
      }
      .toc a {
        color: var(--landing-text-400);
        text-decoration: none;
        transition: color 0.2s;
      }
      .toc li.toc__item--active a {
        color: var(--landing-accent);
      }
      .toc a:hover {
        color: var(--landing-accent);
      }
    `,
  ],
})
export class TocComponent implements AfterViewInit, OnDestroy {
  readonly entries = input<TocEntry[]>([]);
  activeId = signal<string>('');

  private platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const entries = this.entries();
    if (entries.length === 0) return;

    this.observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((r) => r.isIntersecting);
        if (visible.length > 0) {
          this.activeId.set(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    for (const entry of entries) {
      const el = document.getElementById(entry.id);
      if (el) this.observer.observe(el);
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
