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
  { id: 'prototypes', title: 'Prototype pages' },
  { id: 'container', title: 'Container system' },
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

type DdlSubrouteGroupId = 'compositions' | 'patterns' | 'legacy';

type DdlSubroute = {
  readonly path: string;
  readonly title: string;
  readonly desc: string;
};

type DdlSubrouteGroup = {
  readonly id: DdlSubrouteGroupId;
  readonly label: string;
  readonly tone: 'accent' | 'muted';
  readonly routes: readonly DdlSubroute[];
};

const DDL_SUBROUTES: readonly DdlSubrouteGroup[] = [
  {
    id: 'compositions',
    label: 'compositions · page-level section explorations',
    tone: 'accent',
    routes: [
      {
        path: '/ddl/hero-variants',
        title: 'Hero direction variants',
        desc: 'Six hero compositions — V1/V2 + α stagger, β marquee, γ mask wipe, δ magnetic. α picked.',
      },
      {
        path: '/ddl/bio-improvements',
        title: 'Bio card grid · improvements',
        desc: '§3 refinement options — title, bleed, HOURS roulette, email copy, hover, social. Picks flagged.',
      },
      {
        path: '/ddl/selected-work-transitions',
        title: 'Selected Work · transition variants',
        desc: 'Four motion strategies for panel swap — V1 crossfade, V2 text fade-up, V3 cascade, V4 slide.',
      },
      {
        path: '/ddl/stack',
        title: 'Stack · consolidated proposal',
        desc: 'Tier grouping · brand icons · L3 stagger (no bg). Three center intros — pick one. BE punch list.',
      },
      {
        path: '/ddl/story-variants',
        title: '§05 The Story · direction variants',
        desc: 'Four directions to escape the empty-right-side problem — A manuscript, B journal, C spotlight (portrait + abstract), D artifact.',
      },
      {
        path: '/ddl/philosophy-strip',
        title: '§06b Philosophy strip · direction variants',
        desc: 'V0 baseline · V1 cut · V2 ornament pause · V3 sign-off · V4 coda pen-at-rest. Story-tail → variant → CTA sandwich.',
      },
      {
        path: '/ddl/get-in-touch',
        title: '§07 Get in Touch · direction variants',
        desc: 'V1 SVG globe constellation · V2 drag-rotate globe · V3 info panel. Split-intent CTAs + CV placement comparison.',
      },
    ],
  },
  {
    id: 'patterns',
    label: 'patterns & primitives · reusable building blocks',
    tone: 'accent',
    routes: [
      {
        path: '/ddl/backgrounds',
        title: 'Background patterns',
        desc: 'Six pure-CSS section backgrounds — blueprint, topo, hatch, dot matrix, crosshair, aurora.',
      },
      {
        path: '/ddl/fragment-navigation',
        title: 'Fragment navigation',
        desc: 'Four in-page nav patterns — FAB, TOC sidebar, section dots + reading bar, floating pill.',
      },
      {
        path: '/ddl/interactions',
        title: 'Subtle interactions · wishlist',
        desc: 'Micro-interaction candidates grouped by trigger — hover, click, scroll, focus, idle, transition.',
      },
      {
        path: '/ddl/section-header',
        title: 'Section header · cii propagation',
        desc: 'New primitive (eyebrow + center display + italic accent) applied to 5 home sections — pick copy.',
      },
    ],
  },
  {
    id: 'legacy',
    label: 'legacy · superseded; safe to delete in a cleanup pass',
    tone: 'muted',
    routes: [
      {
        path: '/ddl/bio-card-grid',
        title: 'Bio card grid · task 284 PROTOs',
        desc: 'Original ten visual register options for §3. PF2 + PF7 picked and graduated.',
      },
    ],
  },
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
  readonly subrouteGroups = DDL_SUBROUTES;

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
