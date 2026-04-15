import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SectionDescriptor } from './scrollspy-rail.types';

const STATUS_ICONS: Record<string, string> = {
  saved: '✓',
  editing: '●',
  error: '⚠',
  untouched: '○',
};

@Component({
  selector: 'console-scrollspy-rail',
  standalone: true,
  templateUrl: './scrollspy-rail.component.html',
  styleUrl: './scrollspy-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollspyRailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly el = inject(ElementRef);

  /** Section descriptors with id, label, and reactive status */
  sections = input.required<SectionDescriptor[]>();

  /** Currently active section id (driven by IntersectionObserver) */
  activeId = signal<string>('');

  private observer: IntersectionObserver | null = null;

  /** Map section status to display icon */
  statusIcon(status: string): string {
    return STATUS_ICONS[status] ?? '○';
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.setupObserver();
    this.handleInitialFragment();
  }

  /** Navigate to section on click */
  scrollTo(sectionId: string): void {
    const el = this.document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.router.navigate([], {
      relativeTo: this.route,
      fragment: sectionId,
      replaceUrl: true,
    });
  }

  private setupObserver(): void {
    // Header is typically 64px; offset 16px below
    const rootMargin = '-80px 0px 0px 0px';

    this.observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio that is intersecting
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry;
            }
          }
        }
        if (best) {
          this.activeId.set(best.target.id);
        }
      },
      { threshold: [0, 0.5, 1], rootMargin }
    );

    // Observe all section elements
    for (const section of this.sections()) {
      const el = this.document.getElementById(section.id);
      if (el) {
        this.observer.observe(el);
      }
    }

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  private handleInitialFragment(): void {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (fragment) {
        const sectionIds = this.sections().map((s) => s.id);
        if (sectionIds.includes(fragment)) {
          // Delay to let the page render first
          requestAnimationFrame(() => {
            const el = this.document.getElementById(fragment);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        }
      }
    });
  }
}
