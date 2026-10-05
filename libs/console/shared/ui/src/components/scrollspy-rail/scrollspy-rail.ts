import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { SectionDescriptor } from './scrollspy-rail.types';
import { toSectionView } from './scrollspy-rail.util';

@Component({
  selector: 'console-scrollspy-rail',
  standalone: true,
  templateUrl: './scrollspy-rail.html',
  styleUrl: './scrollspy-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollspyRail implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  sections = input.required<SectionDescriptor[]>();

  /** Optional rail header — shows the form/page name at the top of the rail. */
  title = input<string>('');

  /** When false, no active-section indicator is shown (use for atomic save forms) */
  activeIndicator = input<boolean>(true);

  /** Sections with their status read, so the template only reads fields. */
  protected readonly items = computed(() => this.sections().map(toSectionView));

  private readonly fragment = signal<string | null>(null);
  private readonly ioActiveId = signal<string>('');

  /**
   * Active section id: fragment takes priority when it matches a section,
   * IO-driven otherwise (fallback for pages loaded without a fragment).
   */
  readonly activeId = computed(() => {
    const frag = this.fragment();
    const ids = this.sections().map((s) => s.id);
    return frag && ids.includes(frag) ? frag : this.ioActiveId();
  });

  private observer: IntersectionObserver | null = null;
  private readonly intersecting = new Map<string, IntersectionObserverEntry>();

  ngOnInit(): void {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((frag) => {
      this.fragment.set(frag);
      if (!isPlatformBrowser(this.platformId)) return;
      if (
        frag &&
        this.sections()
          .map((s) => s.id)
          .includes(frag)
      ) {
        requestAnimationFrame(() => {
          this.document.getElementById(frag)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });

    if (!isPlatformBrowser(this.platformId)) return;
    if (this.activeIndicator()) {
      this.setupObserver();
    }
  }

  scrollTo(sectionId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      fragment: sectionId,
      replaceUrl: true,
    });
    this.document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setupObserver(): void {
    const rootMargin = '-80px 0px 0px 0px';

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.intersecting.set(entry.target.id, entry);
          } else {
            this.intersecting.delete(entry.target.id);
          }
        }
        let best: IntersectionObserverEntry | null = null;
        for (const entry of this.intersecting.values()) {
          if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
            best = entry;
          }
        }
        if (best) {
          this.ioActiveId.set(best.target.id);
        }
      },
      { threshold: 0, rootMargin }
    );

    for (const section of this.sections()) {
      const el = this.document.getElementById(section.id);
      if (el) this.observer.observe(el);
    }

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }
}
