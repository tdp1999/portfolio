import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import {
  ChipComponent,
  ContainerComponent,
  EyebrowComponent,
  IconComponent,
  LandingHeadingComponent,
  LandingLinkComponent,
  LandingLocaleService,
  LandingTComponent,
} from '@portfolio/landing/shared/ui';
import { ExperienceService, type PublicExperience } from '@portfolio/landing/shared/data-access';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { Locale } from '@portfolio/shared/types';

type ExperienceVm = {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  companyInitial: string;
  position: string;
  domain: string | null;
  dateRangeLabel: string;
  isCurrent: boolean;
  metaItems: readonly string[];
  highlights: readonly string[];
  responsibilities: readonly string[];
  skillChips: readonly { id: string; name: string }[];
  links: readonly { url: string; label: string }[];
  tabId: string;
  panelId: string;
  fragment: string;
};

const FRAGMENT_PREFIX = 'experience-';

@Component({
  selector: 'landing-about-experience',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ChipComponent,
    ContainerComponent,
    EyebrowComponent,
    IconComponent,
    LandingHeadingComponent,
    LandingLinkComponent,
    LandingTComponent,
  ],
  templateUrl: './about-experience.html',
  styleUrl: './about-experience.scss',
})
export class LandingAboutExperienceComponent {
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
    event.preventDefault();
    this.selectedIndex.set(next);
    this.updateFragment(next);
    queueMicrotask(() => {
      const el = this.document.getElementById(list[next!].tabId);
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

function sortReverseChrono(a: PublicExperience, b: PublicExperience): number {
  const aEnd = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
  const bEnd = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
  if (aEnd !== bEnd) return bEnd - aEnd;
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}

function toVm(exp: PublicExperience, lang: Locale): ExperienceVm {
  const position = getLocalized(exp.position, lang);
  const teamRole = getLocalized(exp.teamRole, lang);
  const highlights = exp.highlights?.[lang] ?? [];
  const responsibilities = exp.responsibilities?.[lang] ?? [];

  return {
    id: exp.id,
    slug: exp.slug,
    companyName: exp.companyName,
    companyUrl: exp.companyUrl,
    companyLogoUrl: exp.companyLogoUrl,
    companyInitial: initialOf(exp.companyName),
    position,
    domain: exp.domain,
    dateRangeLabel: formatDateRange(exp.startDate, exp.endDate),
    isCurrent: !exp.endDate,
    metaItems: buildMetaItems(exp, teamRole),
    highlights,
    responsibilities,
    skillChips: exp.skills.map((s) => ({ id: s.id, name: getLocalized(s.name, lang) })),
    links: exp.links.map((l) => ({ url: l.url, label: l.label })),
    tabId: `${FRAGMENT_PREFIX}${exp.slug}-tab`,
    panelId: `${FRAGMENT_PREFIX}${exp.slug}-panel`,
    fragment: `${FRAGMENT_PREFIX}${exp.slug}`,
  };
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '';
}

/** "May 2024 – Present" / "Jan 2021 – Apr 2024". Locale-agnostic English month abbrevs;
 *  the surrounding meta strip is the only English-locked label and it reads consistently
 *  in both EN and VI shells (mirrors prior career-history component). */
function formatDateRange(startStr: string, endStr: string | null): string {
  const start = formatMonth(startStr);
  const end = endStr ? formatMonth(endStr) : 'Present';
  return `${start} – ${end}`;
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "Team of 6 · Tech Lead · Full Time · Remote, Ho Chi Minh City, Vietnam".
 *  Collapses any missing field cleanly — never produces stray separators. */
function buildMetaItems(exp: PublicExperience, teamRole: string): readonly string[] {
  const items: string[] = [];
  const team = teamSizeLabel(exp.teamSizeMin, exp.teamSizeMax);
  if (team) items.push(team);
  if (teamRole) items.push(teamRole);
  const employment = EMPLOYMENT_TYPE_LABELS[exp.employmentType];
  if (employment) items.push(employment);
  const location = locationLabel(exp);
  if (location) items.push(location);
  return items;
}

function teamSizeLabel(min: number | null, max: number | null): string {
  if (min && max && min !== max) return `Team of ${min}–${max}`;
  const n = min ?? max;
  return n ? `Team of ${n}` : '';
}

function locationLabel(exp: PublicExperience): string {
  const type = LOCATION_TYPE_LABELS[exp.locationType];
  const place = [exp.locationCity, exp.locationCountry].filter((s): s is string => Boolean(s)).join(', ');
  if (type && place) return `${type}, ${place}`;
  return type || place;
}
