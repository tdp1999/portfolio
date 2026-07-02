import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import { Chip, Container, Eyebrow, Icon, Heading, Link, LandingLocaleService, T } from '@portfolio/landing/shared/ui';
import { RteRender } from '@portfolio/shared/features/rte-renderer';
import { ExperienceService } from '@portfolio/landing/shared/data-access';
import { FRAGMENT_PREFIX } from './about.experience.data';
import type { ExperienceVm } from './about.experience.types';
import { sortReverseChrono, toVm } from './about.experience.util';

@Component({
  selector: 'landing-about-experience',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Chip, Container, Eyebrow, Icon, Heading, Link, T, RteRender],
  templateUrl: './about.experience.html',
  styleUrl: './about.experience.scss',
})
export class AboutExperience {
  private readonly experienceService = inject(ExperienceService);
  private readonly locale = inject(LandingLocaleService).locale;
  private readonly breakpoint = inject(BreakpointObserverService).observe();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  /** SSR default: desktop layout. Mobile observer flips post-hydration. */
  protected readonly isMobile = computed(() => this.breakpoint().name === 'mobile');

  /** Reverse-chronological (latest first). `endDate === null` (current) outranks any past role. */
  private readonly experiences = toSignal(this.experienceService.getPublicExperiences(), { initialValue: [] });

  protected readonly vms = computed<readonly ExperienceVm[]>(() => {
    const lang = this.locale();
    return [...this.experiences()].sort(sortReverseChrono).map((exp) => toVm(exp, lang));
  });

  /** Selected tab / open accordion. `-1` = all-collapsed (accordion mode only). */
  protected readonly selectedIndex = signal(0);

  constructor() {
    // Sync selection from URL fragment on init + when fragment changes (deep-link).
    const fragmentSig = toSignal(this.route.fragment, { initialValue: this.route.snapshot.fragment });

    effect(() => {
      const list = this.vms();
      if (list.length === 0) return;
      const frag = fragmentSig();
      if (!frag || !frag.startsWith(FRAGMENT_PREFIX)) return;
      const idx = list.findIndex((v) => v.fragment === frag);
      if (idx >= 0) this.selectedIndex.set(idx);
    });
  }

  protected onTabClick(index: number): void {
    if (this.selectedIndex() === index) return;
    this.selectedIndex.set(index);
    this.updateFragment(index);
  }

  protected onAccordionToggle(index: number): void {
    this.selectedIndex.update((prev) => (prev === index ? -1 : index));
    // Only push a fragment when opening (not when collapsing all).
    if (this.selectedIndex() === index) this.updateFragment(index);
  }

  /** Roving tabindex + Home/End + arrow keys per WAI-ARIA tablist pattern. */
  protected onTabKeydown(event: KeyboardEvent, index: number): void {
    const list = this.vms();
    const max = list.length - 1;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = index === max ? 0 : index + 1;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = index === 0 ? max : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    if (next === null) return;
    event.preventDefault();
    this.selectedIndex.set(next);
    this.updateFragment(next);
    queueMicrotask(() => {
      const el = this.document.getElementById(list[next].tabId);
      el?.focus();
    });
  }

  protected hideBrokenImage(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLElement) target.style.display = 'none';
  }

  private updateFragment(index: number): void {
    const v = this.vms()[index];
    if (!v) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: v.fragment,
      replaceUrl: true,
      queryParamsHandling: 'preserve',
    });
  }
}
