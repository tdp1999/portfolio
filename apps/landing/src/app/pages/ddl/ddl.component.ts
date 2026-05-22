import { Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ICON_PROVIDER,
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
  SegmentOption,
  LandingBackLinkComponent,
  LandingEmptyStateComponent,
  LandingLoadingSpinnerComponent,
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
  { id: 'loading', title: 'Loading spinner & router progress' },
  { id: 'headings', title: 'Section heading variants' },
];

type DdlSubrouteGroupId = 'compositions' | 'blocks' | 'patterns' | 'legacy';

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
        desc: 'Globe graduated to /contact. Seven 1-col home variants (A–G) route into /contact?purpose=… — variant G (centered, 3-purpose + email fallback) shipped to home. Comparison sandbox retained.',
      },
      {
        path: '/ddl/about-signatures',
        title: '/about · signature sections sandbox',
        desc: 'Staging for three undesigned /about elements — depth map · failures · currently shipping. Scaffold for variants (tasks 334–336); winners graduate via task 337.',
      },
    ],
  },
  {
    id: 'blocks',
    label: 'blocks · multi-primitive compositions for feed/index pages',
    tone: 'accent',
    routes: [
      {
        path: '/ddl/feed-item-variants',
        title: 'Feed · item layout variants',
        desc: 'Row (3 sub-variants) · Card · Timeline — side-by-side on same fake data. Pick default for /projects + /blog.',
      },
      {
        path: '/ddl/feed-filter-bar',
        title: 'Feed · filter bar variants',
        desc: 'V1 chip-row · V2 dropdown-per-facet · V3 sidebar · V4 search+autocomplete. Year + status + stack filter UX.',
      },
      {
        path: '/ddl/feed-pagination',
        title: 'Feed · pagination strategies',
        desc: 'V1 render-all · V2 load-more · V3 paged. When to switch + scroll/SSR/footer trade-offs.',
      },
      {
        path: '/ddl/project-detail-explore',
        title: 'Project detail · cover + layout explore',
        desc: '5 cover aspect ratios × 4 body layouts. Compare hero crop and TOC/meta placement before graduating picks to project-detail.',
      },
      {
        path: '/ddl/prose-flow',
        title: 'Prose flow · vertical rhythm spec',
        desc: 'Source of truth for .landing-prose — h1/h2/h3 leading-larger-than-trailing, blockquote/figure/code/lists with explicit halos. Applied to project-detail, blog-detail.',
      },
      {
        path: '/ddl/uses-card-variants',
        title: 'Uses · card variants',
        desc: 'Three mini-card directions × two section-separation strategies for /uses tool entries. V2 monogram + S1 picked → graduated.',
      },
      {
        path: '/ddl/email-templates',
        title: 'Contact email templates · direction variants',
        desc: 'Three takes each for auto-reply (sent to submitter) and admin-notification. Rendered in sandboxed iframes so email-client CSS constraints (tables, inline styles, system font fallback) are visible. V0 baseline + V1 / V2 candidates per row.',
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
      {
        path: '/ddl/page-hero',
        title: 'Page hero · child-page composition',
        desc: 'Eyebrow + heading + lede bundle used across /contact, /uses, /colophon. Left/center variants, size scale, italic-em accent.',
      },
      {
        path: '/ddl/page-shell',
        title: 'Page shell · canonical feature-page composition',
        desc: 'Article > header (breadcrumb + page-hero + meta strip) > section body > optional footer. Four meta-strip variants: composite, legal, catalogue, talk-to-me. Mandatory for all subpages.',
      },
      {
        path: '/ddl/form-input',
        title: 'Form input · primitive variants (historical)',
        desc: 'Three visual directions for landing-input + landing-textarea. Variant B picked + shipped 2026-05-21; A/C kept as historical record.',
      },
      {
        path: '/ddl/form-lib',
        title: 'Form lib · shipped suite (C21)',
        desc: 'Live reactive-form playground for the shipped landing form primitives — input · textarea · checkbox · radio · form-field. Hint/error meta-row contract documented.',
      },
      {
        path: '/ddl/language-switcher',
        title: 'Language switcher · direction variants',
        desc: 'Six EN/VI toggle directions in-header — segmented, mono inline, dropdown, globe, flip pill, marquee swap. Decision matrix + research stepback.',
      },
      {
        path: '/ddl/command-palette',
        title: 'Command palette · Cmd+K directions',
        desc: 'Four Cmd+K UX directions — Linear, Spotlight, Raycast, Minimal. Mock data (Pages · Sections · Actions · Projects), keyboard nav, hybrid static+API architecture note.',
      },
      {
        path: '/ddl/mega-menu',
        title: 'Mega-menu · More dropdown variants',
        desc: 'Six layout directions for the header "More" panel — refined row, centered cards, typography-only, editorial eyebrow, hero+list, inline-glyph reveal. Research stepback + decision matrix.',
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
  selector: 'landing-ddl',
  standalone: true,
  imports: [
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
    LandingLoadingSpinnerComponent,
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
