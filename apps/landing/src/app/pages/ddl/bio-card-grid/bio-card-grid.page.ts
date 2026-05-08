import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContainerComponent,
  LandingBreadcrumbComponent,
  LandingLinkComponent,
  StatusDotComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

/**
 * /ddl/bio-card-grid — Prototype gallery for task 284 §3 Bio Card Grid.
 *
 * Renders 10 PROTO scenes with sample identity / philosophy / contact content
 * so the author can pick a visual register. Patterns `asia-outline` and
 * `graticule` are scoped here (not yet in `landing-background`) — promoted to
 * the shared primitive only if picked.
 *
 * NOT a final implementation — exploration only. Delete this file after
 * task 284 lands and the pick is folded into `feature-home`.
 */

type ProtoId =
  | 'p1-plain'
  | 'p2-section-mark'
  | 'p3-numbered'
  | 'p4-asymmetric'
  | 'p5-asia-outline'
  | 'p6-graticule'
  | 'p7-bracketed'
  | 'p8-vertical-tabs'
  | 'p9-header-band'
  | 'p10-spine'
  | 'pf1-spotlight'
  | 'pf2-aurora'
  | 'pf3-editorial'
  | 'pf4-showcase'
  | 'pf5-boundary'
  | 'pf6-brutalist'
  | 'pf7-dimensional'
  | 'pf8-doc-engine'
  | 'pf9-compass'
  | 'pf10-constellation';

type ProtoEntry = {
  id: ProtoId;
  label: string;
  hint: string;
  combo: string;
};

const PROTOS: readonly ProtoEntry[] = [
  {
    id: 'p1-plain',
    label: 'P1 · Plain Editorial',
    hint: 'Most minimal. Hairline only, equal cards, no header.',
    combo: 'C-H1 + C-B1 + C-L1 + C-D1',
  },
  {
    id: 'p2-section-mark',
    label: 'P2 · Section-mark Eyebrow',
    hint: '§3/WHO header + §3.1/§3.2/§3.3 per-card eyebrow.',
    combo: 'C-H2 + C-B1 + C-L1 + C-D3',
  },
  {
    id: 'p3-numbered',
    label: 'P3 · Numbered Set',
    hint: '01/02/03 mono index. Pure Parth-pattern.',
    combo: 'C-H1 + C-B1 + C-L1 + C-D2',
  },
  {
    id: 'p4-asymmetric',
    label: 'P4 · Asymmetric Read-Zone',
    hint: '1fr / 1.4fr / 1fr — Card B wider for prose.',
    combo: 'C-H2 + C-B1 + C-L2 + C-D3',
  },
  {
    id: 'p5-asia-outline',
    label: 'P5 · Geographic (asia-outline)',
    hint: 'NEW bg: faint SE-Asia coastline + HCMC dot.',
    combo: 'C-H2 + C-B5 + C-L1 + C-D3',
  },
  {
    id: 'p6-graticule',
    label: 'P6 · Graticule Grid',
    hint: 'NEW bg: sparse lat/long grid lines.',
    combo: 'C-H2 + C-B4 + C-L1 + C-D3',
  },
  {
    id: 'p7-bracketed',
    label: 'P7 · Bracketed Set',
    hint: 'Terminal artifact ┌ ┐ └ ┘ corner ticks outside border.',
    combo: 'C-H1 + C-B1 + C-L1 + C-D4',
  },
  {
    id: 'p8-vertical-tabs',
    label: 'P8 · Vertical Tab Labels',
    hint: 'Rotated mono label in 10px left column.',
    combo: 'C-H1 + C-B1 + C-L1 + C-D5',
  },
  {
    id: 'p9-header-band',
    label: 'P9 · Header Band per Card',
    hint: 'Inset rule — eyebrow band on ink-0, body on ink-1.',
    combo: 'C-H2 + C-B1 + C-L1 + C-D8',
  },
  {
    id: 'p10-spine',
    label: 'P10 · Spine + Asymmetric',
    hint: 'P4 + vertical hairline spine bridging gaps.',
    combo: 'C-H2 + C-B1 + C-L2 + C-L5 + C-D3',
  },

  // ── PF series: high-polish (E4-C unlocked per ADR-017) ──────────────────────
  {
    id: 'pf1-spotlight',
    label: 'PF1 · Spotlight Bento',
    hint: 'Parth-clone. Radial spotlight, 20px radius, gradient hairline.',
    combo: 'bento · radial-glow · soft-radius',
  },
  {
    id: 'pf2-aurora',
    label: 'PF2 · Aurora Mesh',
    hint: 'Indigo blobs + frosted glass cards (backdrop-blur). Palette-safe.',
    combo: 'mesh-bg · glassmorphism · blur',
  },
  {
    id: 'pf3-editorial',
    label: 'PF3 · Editorial Magazine',
    hint: 'No bento. 2-col asymmetric, big serif headline, mono data column.',
    combo: 'editorial · hairline · density',
  },
  {
    id: 'pf4-showcase',
    label: 'PF4 · Showcase Artifact',
    hint: 'Card B embeds real product screenshot. Procida rule 2.',
    combo: 'embed-asset · proof-of-work',
  },
  {
    id: 'pf5-boundary',
    label: 'PF5 · Breaking Boundary',
    hint: 'Large analog clock SVG floats across cards, breaking grid.',
    combo: 'overflow-element · z-stack',
  },
  {
    id: 'pf6-brutalist',
    label: 'PF6 · Brutalist Mono',
    hint: '2px hard borders, no radius, all-mono, ASCII-style name.',
    combo: 'brutalist · counter-direction',
  },
  {
    id: 'pf7-dimensional',
    label: 'PF7 · Dimensional Layers',
    hint: 'CSS perspective + multi-layer drop-shadow + paper noise.',
    combo: 'pseudo-3d · layered-shadow',
  },

  // ── Centerpiece-orbit family (PF2 glass + PF5 hover + full-bleed) ───────────
  {
    id: 'pf8-doc-engine',
    label: 'PF8 · Doc Engine Orbit',
    hint: 'Centerpiece: animated Document Engine wireframe. Cards orbit in C-L2.',
    combo: 'orbit · proof-of-work · glass · full-bleed',
  },
  {
    id: 'pf9-compass',
    label: 'PF9 · HCMC Compass Orbit',
    hint: 'Centerpiece: concentric rings + coordinates 10.776°N · 106.700°E pulsing.',
    combo: 'orbit · geographic · glass · full-bleed',
  },
  {
    id: 'pf10-constellation',
    label: 'PF10 · Stack Constellation Orbit',
    hint: 'Centerpiece: stack tags on slow rotating rings around STACK label.',
    combo: 'orbit · stack-as-solar-system · glass · full-bleed',
  },
];

const PROTO_IDS = new Set<string>(PROTOS.map((p) => p.id));

function readProtoParam(value: string | null): ProtoId {
  return value && PROTO_IDS.has(value) ? (value as ProtoId) : 'p1-plain';
}

function readCardsParam(value: string | null): 3 | 4 {
  return value === '4' ? 4 : 3;
}

@Component({
  selector: 'landing-bio-card-grid-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ContainerComponent, LandingBreadcrumbComponent, LandingLinkComponent, StatusDotComponent],
  templateUrl: './bio-card-grid.page.html',
  styleUrl: './bio-card-grid.page.scss',
})
export class BioCardGridPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly protos = PROTOS;
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Bio Card Grid' }];

  /** Active proto, seeded from `?proto=` query param so reload preserves it. */
  readonly active = signal<ProtoId>(readProtoParam(this.route.snapshot.queryParamMap.get('proto')));
  readonly entry = computed(() => PROTOS.find((p) => p.id === this.active()) ?? PROTOS[0]);

  /** 3- vs 4-card layout — only meaningful for the orbit family (PF8/9/10).
   *  Seeded from `?cards=` so reload preserves it. */
  readonly cardCount = signal<3 | 4>(readCardsParam(this.route.snapshot.queryParamMap.get('cards')));
  readonly isOrbit = computed(() => {
    const id = this.active();
    return id === 'pf8-doc-engine' || id === 'pf9-compass' || id === 'pf10-constellation';
  });

  /** Sync state → URL without triggering a router navigation, otherwise
   *  Angular's scroll-position-restoration would jump the page back to the
   *  top each time. `Location.replaceState` updates the address bar in
   *  place via the History API. */
  private readonly syncQueryParams = effect(() => {
    const proto = this.active();
    const cards = this.cardCount();
    const isOrbit = this.isOrbit();
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { proto, cards: isOrbit ? cards : null },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(tree.toString());
  });

  /**
   * Precomputed clock-face hour marks for PF5 boundary clock SVG.
   * 12 marks at 30° intervals, starting from 12 o'clock position.
   */
  protected readonly clockMarks = Array.from({ length: 12 }, (_, m) => {
    const angle = ((m * 30 - 90) * Math.PI) / 180;
    const cx = 100;
    const cy = 100;
    return {
      x1: cx + 76 * Math.cos(angle),
      y1: cy + 76 * Math.sin(angle),
      x2: cx + 88 * Math.cos(angle),
      y2: cy + 88 * Math.sin(angle),
    };
  });

  /**
   * Stack constellation nodes for PF10. Two rings; each node positioned by angle.
   * Inner ring = 4 core langs/frameworks; outer ring = 4 supporting tools.
   */
  protected readonly stackNodes = [
    { ring: 'inner' as const, angle: 0, label: 'Angular' },
    { ring: 'inner' as const, angle: 90, label: 'NestJS' },
    { ring: 'inner' as const, angle: 180, label: 'TypeScript' },
    { ring: 'inner' as const, angle: 270, label: 'RxJS' },
    { ring: 'outer' as const, angle: 45, label: 'Prisma' },
    { ring: 'outer' as const, angle: 135, label: 'Tailwind' },
    { ring: 'outer' as const, angle: 225, label: 'Nx' },
    { ring: 'outer' as const, angle: 315, label: 'Postgres' },
  ];

  setActive(id: ProtoId): void {
    this.active.set(id);
  }

  setCardCount(n: 3 | 4): void {
    this.cardCount.set(n);
  }
}
