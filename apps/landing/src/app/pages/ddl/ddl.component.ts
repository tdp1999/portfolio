import { CommonModule, Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ICON_PROVIDER,
  IconComponent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  LandingLinkComponent,
  LandingIconArrowComponent,
  ContainerComponent,
  SectionComponent,
  ChipComponent,
  EyebrowComponent,
  StatusDotComponent,
  FigureComponent,
  PullQuoteComponent,
  SectionRuleComponent,
  SegmentedComponent,
  SegmentOption,
  LandingBackLinkComponent,
  LandingEmptyStateComponent,
  LandingFloatingPillNavComponent,
  LandingScrollspyService,
  type InPageSection,
} from '@portfolio/landing/shared/ui';

const TABS_WITH_PROTOTYPES: readonly SegmentOption[] = [
  { id: 'showcase', label: 'Showcase' },
  { id: 'prototypes', label: 'Prototypes' },
  { id: 'usage', label: 'Usage' },
];

const TABS_NO_PROTOTYPES: readonly SegmentOption[] = [
  { id: 'showcase', label: 'Showcase' },
  { id: 'usage', label: 'Usage' },
];

const DDL_SECTIONS: readonly InPageSection[] = [
  { id: 'container', title: 'Container system' },
  { id: 'prototypes', title: 'Prototype pages' },
  { id: 'tokens', title: 'Landing tokens' },
  { id: 'typography', title: 'Typography' },
  { id: 'primitives', title: 'Button · Link · Arrow' },
  { id: 'labels', title: 'Chip · Eyebrow · Status dot' },
  { id: 'content', title: 'Figure · Pull-quote · Rule' },
  { id: 'segmented', title: 'Segmented control' },
  { id: 'icon-input', title: 'Icon & Input' },
  { id: 'utilities', title: 'Back link & empty state' },
  { id: 'headings', title: 'Section heading variants' },
];

@Component({
  selector: 'app-ddl',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    ButtonComponent,
    InputComponent,
    LandingLinkComponent,
    LandingIconArrowComponent,
    ContainerComponent,
    ChipComponent,
    EyebrowComponent,
    StatusDotComponent,
    FigureComponent,
    PullQuoteComponent,
    SectionRuleComponent,
    SegmentedComponent,
    LandingBackLinkComponent,
    LandingEmptyStateComponent,
    LandingFloatingPillNavComponent,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './ddl.component.html',
  styleUrl: './ddl.component.scss',
})
export class DdlComponent {
  private readonly iconProvider = inject(ICON_PROVIDER);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly iconNames = this.iconProvider.getSupportedIcons();
  readonly sections = DDL_SECTIONS;

  constructor() {
    this.scrollspy.setSections(DDL_SECTIONS);
  }

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
