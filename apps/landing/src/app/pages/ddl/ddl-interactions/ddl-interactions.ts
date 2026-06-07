import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Container,
  CopyToClipboardDirective,
  Icon,
  Breadcrumb,
  StatusDot,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

type Scope = 'whole-landing' | 'home' | 'project-detail';
type Effort = 'S' | 'M' | 'L';
type DemoKind = 'live' | 'descriptive';

interface WishlistItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly scope: Scope;
  readonly effort: Effort;
  readonly demoKind: DemoKind;
}

interface WishlistGroup {
  readonly category: string;
  readonly description: string;
  readonly items: readonly WishlistItem[];
}

const PICKS_STORAGE_KEY = 'ddl-interactions-picks-v1';

/**
 * /ddl/interactions — landing-wide micro-interaction wishlist with live demos.
 *
 * Each item renders a working preview so it can be evaluated visually before
 * being graduated to a real component task. Click ★ to mark for selection;
 * picks are persisted in localStorage so the list survives a refresh.
 */
@Component({
  selector: 'landing-ddl-interactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Breadcrumb, Icon, StatusDot, CopyToClipboardDirective],
  templateUrl: './ddl-interactions.html',
  styleUrl: './ddl-interactions.scss',
})
export class DdlInteractions {
  private readonly platformId = inject(PLATFORM_ID);

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Interactions' }];

  readonly groups: readonly WishlistGroup[] = [
    {
      category: 'Hover · cursor',
      description:
        'Triggered by mouse hover. Lightweight, high frequency. Default tier for "feels polished" without ceremony.',
      items: [
        {
          id: 'eyebrow-tick',
          title: 'Section eyebrows: numeric tick',
          detail:
            'Hover NN · Label → mono digit briefly ticks to next number then back (≤80ms Y bounce). Hints "this anchors to a section."',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'chip-underline',
          title: 'Chip stack: underline draw-in',
          detail: 'Hover on a tech chip → 1px accent underline draws left→right (160ms). No scale, no color flash.',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'project-tab-direction',
          title: 'Project tab buttons: directional feedback',
          detail:
            'Hover unselected tab → eyebrow index ticks toward the active tab\'s direction, signalling "you\'re moving here."',
          scope: 'home',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'spotlight-bloom',
          title: 'Spotlight intensity bloom near accent CTAs',
          detail:
            'Existing fxSpotlight: when cursor enters within ~40px of an indigo CTA, intensity grows 1.2× briefly.',
          scope: 'whole-landing',
          effort: 'M',
          demoKind: 'live',
        },
      ],
    },
    {
      category: 'Click · feedback',
      description: 'Confirmation that the action registered. Inline icon swap is the locked pattern (see §D).',
      items: [
        {
          id: 'copy-check-swap',
          title: 'Copy-to-clipboard: inline check swap',
          detail:
            'Locked. Icon copy → check, 1.5s revert. Applies to email, repo URLs, slug copy buttons, etc. — wired via shared directive.',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'theme-crossfade',
          title: 'Theme toggle: 280ms surface crossfade + 1-frame highlight',
          detail:
            'All surfaces (bg, text, borders) transition for 280ms. Toggle button itself gets a 16ms accent flash to confirm the click landed.',
          scope: 'whole-landing',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'anchor-pulse',
          title: 'Anchor links: target section pulse',
          detail:
            "Click NN eyebrow or pill-nav item → smooth scroll + target section's top accent rule pulses once (1s).",
          scope: 'whole-landing',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'button-press-inset',
          title: 'Button press: 1-frame inset shadow',
          detail: 'Primary buttons get a brief inset shadow on active state (mousedown). Releases on mouseup. Tactile.',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
      ],
    },
    {
      category: 'Scroll · ambient',
      description:
        'Triggered by scroll position. Use sparingly — the brand direction explicitly says "no scroll-triggered reveal."',
      items: [
        {
          id: 'blueprint-parallax',
          title: 'Hero blueprint grid: scroll-tied parallax',
          detail: 'Grid translateY 0→24px tied to scroll progress within hero only. Pauses outside hero range.',
          scope: 'home',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'rule-line-draw',
          title: 'Section rule lines: one-shot draw-in',
          detail:
            'When a section rule crosses 80% viewport, draw left→right. Only fires once per section (no replay on scroll-up).',
          scope: 'whole-landing',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'toc-active-dim',
          title: 'Project detail sticky sidebar: active ToC dim',
          detail: 'Inactive ToC items dim to text-700 opacity; active brightens to accent.',
          scope: 'project-detail',
          effort: 'S',
          demoKind: 'live',
        },
      ],
    },
    {
      category: 'Focus · keyboard',
      description: 'Triggered by Tab navigation. Must be visible — accessibility hard requirement.',
      items: [
        {
          id: 'card-focus-rim',
          title: 'Card focus: accent rim + lift',
          detail:
            'Tab onto a card → border-color shifts to accent + translateY(-2px). Replaces default browser outline inside landing surfaces.',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'skip-to-content',
          title: 'Skip-to-content link: fade-in from top',
          detail: 'Hidden visually until Tab focused, then slides down from top with mono caps "SKIP TO CONTENT →".',
          scope: 'whole-landing',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'palette-focus-trap',
          title: 'Focus trap on opened command palette (when added)',
          detail:
            '⌘K palette mentioned in E5 stub. When opened, Tab cycles within palette + Esc closes. Future task — depends on palette existing.',
          scope: 'whole-landing',
          effort: 'L',
          demoKind: 'descriptive',
        },
      ],
    },
    {
      category: 'Idle · life signs',
      description:
        'Triggered by time, no user action required. Risk: distraction. Always cap to ≤1 motion at a time per viewport.',
      items: [
        {
          id: 'status-dot-pulse',
          title: 'Status dot: slow pulse when AVAILABLE',
          detail: '3s pulse cycle, opacity 0.6 → 1 → 0.6. Only when state="available"; busy stays static.',
          scope: 'home',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'clock-minute-tick',
          title: 'Live clock: minute-tick underline blink',
          detail:
            'When the minute value changes, a 1px accent underline blinks once (200ms). Pairs with §C type-out for fuller TZ change.',
          scope: 'home',
          effort: 'S',
          demoKind: 'live',
        },
        {
          id: 'aurora-drift',
          title: 'Aurora blobs: slow drift loop',
          detail: 'Very slow translation (12s ease-in-out) on the 3 blobs. Pauses while user is scrolling.',
          scope: 'home',
          effort: 'M',
          demoKind: 'live',
        },
      ],
    },
    {
      category: 'Page transitions',
      description: 'Triggered on route navigation. Prevents harsh swap between pages.',
      items: [
        {
          id: 'router-fade',
          title: 'Router-outlet fade',
          detail:
            'Fade out 90ms → fade in 180ms on route change. Apply at landing-shell layer with Angular animations.',
          scope: 'whole-landing',
          effort: 'M',
          demoKind: 'live',
        },
        {
          id: 'detail-mask-reveal',
          title: 'Project detail hero: mask reveal',
          detail:
            'Hero image enters with linear-gradient mask sweeping from bottom (600ms ease-out). One-shot, no replay.',
          scope: 'project-detail',
          effort: 'M',
          demoKind: 'live',
        },
      ],
    },
  ];

  readonly totalItems = this.groups.reduce((sum, g) => sum + g.items.length, 0);

  // ── Pick state (persisted in localStorage) ───────────────────────────────

  protected readonly picks = signal<ReadonlySet<string>>(new Set());
  protected readonly pickedCount = computed(() => this.picks().size);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const raw = localStorage.getItem(PICKS_STORAGE_KEY);
        if (raw) this.picks.set(new Set(JSON.parse(raw)));
      } catch {
        // ignore corrupt state
      }
      effect(() => {
        const value = JSON.stringify([...this.picks()]);
        try {
          localStorage.setItem(PICKS_STORAGE_KEY, value);
        } catch {
          // localStorage may be unavailable (private mode, quota); silent-fail.
        }
      });
    }
  }

  togglePick(id: string): void {
    const next = new Set(this.picks());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.picks.set(next);
  }

  // ── Demo-local state ─────────────────────────────────────────────────────

  protected readonly anchorPulseKey = signal(0);
  pulseAnchor(): void {
    this.anchorPulseKey.update((k) => k + 1);
  }

  /** Used to replay the page-fade demo by toggling between two mock pages. */
  protected readonly routerPage = signal<'A' | 'B'>('A');
  protected readonly routerFadeKey = signal(0);
  flipRouterPage(): void {
    this.routerPage.update((p) => (p === 'A' ? 'B' : 'A'));
    this.routerFadeKey.update((k) => k + 1);
  }

  /** Mask reveal replay key. */
  protected readonly maskRevealKey = signal(0);
  replayMaskReveal(): void {
    this.maskRevealKey.update((k) => k + 1);
  }

  /** Project tab demo: index 0..2, default to middle as "active". */
  protected readonly activeTab = signal(1);
  setActiveTab(i: number): void {
    this.activeTab.set(i);
  }

  /** Theme demo: dark vs light surface inside one card. */
  protected readonly demoTheme = signal<'dark' | 'light'>('dark');
  toggleDemoTheme(): void {
    this.demoTheme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  // ── Blueprint parallax (scroll-tied) ─────────────────────────────────────

  private readonly parallaxBox = viewChild<ElementRef<HTMLElement>>('parallaxBox');
  protected readonly parallaxOffset = signal(0);

  onParallaxScroll(event: Event): void {
    const el = event.currentTarget as HTMLElement;
    const ratio = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    this.parallaxOffset.set(Math.round(ratio * 24));
  }

  // ── Clock minute tick (faked: blink every 6s) ────────────────────────────

  protected readonly clockTickKey = signal(0);
  protected readonly clockMinute = signal(new Date().getMinutes());

  private clockTimer: ReturnType<typeof setInterval> | null = null;

  /** Lazy-start interval when the clock demo is first visible. */
  startClockDemo(): void {
    if (!isPlatformBrowser(this.platformId) || this.clockTimer) return;
    this.clockTimer = setInterval(() => {
      this.clockMinute.update((m) => (m + 1) % 60);
      this.clockTickKey.update((k) => k + 1);
    }, 6000); // demo speed — real interaction would be one tick per real minute.
  }
}
