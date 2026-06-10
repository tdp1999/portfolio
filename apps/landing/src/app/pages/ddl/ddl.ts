import { Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ICON_PROVIDER,
  Icon,
  Button,
  Input,
  Link,
  IconArrow,
  Container,
  Chip,
  Eyebrow,
  StatusDot,
  Figure,
  PullQuote,
  SectionRule,
  Segmented,
  BackLink,
  EmptyState,
  LoadingSpinner,
  FloatingPillNav,
  LandingScrollspyService,
} from '@portfolio/landing/shared/ui';
import { DDL_SECTIONS, DDL_SUBROUTES, TABS_NO_PROTOTYPES, TABS_WITH_PROTOTYPES } from './ddl.data';

@Component({
  selector: 'landing-ddl',
  standalone: true,
  imports: [
    RouterLink,
    Icon,
    Button,
    Input,
    Link,
    IconArrow,
    Container,
    Chip,
    Eyebrow,
    StatusDot,
    Figure,
    PullQuote,
    SectionRule,
    Segmented,
    BackLink,
    EmptyState,
    LoadingSpinner,
    FloatingPillNav,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './ddl.html',
  styleUrl: './ddl.scss',
})
export class Ddl {
  // ──────── Injections ─────────────────────────────────────────────────
  private readonly iconProvider = inject(ICON_PROVIDER);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly scrollspy = inject(LandingScrollspyService);

  // ──────── Data ────────────────────────────────────────────────────────
  readonly iconNames = this.iconProvider.getSupportedIcons();
  readonly sections = DDL_SECTIONS;

  // Raw snippet bound via [innerText] so the Angular template parser doesn't
  // try to interpret @if / @else / { } as control flow.
  readonly loadingSnippet = `@if (resource.showSpinner()) {
  <landing-loading-spinner message="Loading projects…" />
} @else if (resource.isEmpty()) {
  <landing-empty-state ... />
} @else {
  <!-- content -->
}`;
  readonly subrouteGroups = DDL_SUBROUTES;

  readonly tabsWithPrototypes = TABS_WITH_PROTOTYPES;
  readonly tabsNoPrototypes = TABS_NO_PROTOTYPES;

  readonly typographyTab = this.makeTabSignal('typography', 'showcase');
  readonly interactiveTab = this.makeTabSignal('interactive', 'showcase');
  readonly labelTab = this.makeTabSignal('label', 'showcase');
  readonly contentTab = this.makeTabSignal('content', 'showcase');
  readonly segmentedTab = this.makeTabSignal('segmented', 'showcase');
  readonly segDemoA = signal('showcase');
  readonly segDemoB = signal('showcase');
  readonly segDemoC = signal('s1');

  // ──────── Constructor ─────────────────────────────────────────────────
  constructor() {
    this.scrollspy.setSections(DDL_SECTIONS);
  }

  // ──────── Methods ─────────────────────────────────────────────────────
  private makeTabSignal(key: string, defaultValue: string) {
    const initial = this.route.snapshot.queryParamMap.get(key) ?? defaultValue;
    const sig = signal(initial);
    effect(() => {
      const value = sig();
      const current = this.route.snapshot.queryParamMap.get(key);
      if (current === value) return;
      // Use Location.replaceState — router.navigate triggers
      // `withInMemoryScrolling`'s scrollPositionRestoration which jumps to top
      // on every query-param change, even with replaceUrl. We only need the URL
      // to mirror state, not a full navigation.
      const tree = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: { [key]: value },
        queryParamsHandling: 'merge',
      });
      this.location.replaceState(this.router.serializeUrl(tree));
    });
    return sig;
  }
}
