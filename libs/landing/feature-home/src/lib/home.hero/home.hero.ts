import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import {
  Container,
  StatusDot,
  Background,
  StaggerText,
  Link,
  LandingLocaleService,
  resolveCopy,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-home-hero',
  standalone: true,
  imports: [Container, StatusDot, Background, StaggerText, Link],
  templateUrl: './home.hero.html',
  styleUrl: './home.hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHero {
  readonly fullName = input<string>('');
  readonly title = input<string>('');
  readonly tagline = input<string>('');
  readonly city = input<string>('');
  readonly available = input<boolean>(false);
  readonly stackIntro = input<string>('');
  /** Authored hero chips (3–4 short tokens). Falls back to tokenizing `stackIntro` when empty. */
  readonly coreStackChips = input<readonly string[]>([]);
  /** True once the public profile HTTP call has resolved (success or fail). Drives the STATUS row visibility. */
  readonly profileLoaded = input<boolean>(false);
  /** Resolved resume URL for the reader's locale, or '' when the profile carries none. */
  readonly resumeUrl = input<string>('');
  /**
   * Set when the resolved resume is NOT in the reader's own language — it holds the
   * language actually being downloaded. The CTA then names that language instead of
   * handing over the other locale's PDF unannounced. `null` when the file matches.
   */
  readonly resumeFallbackLocale = input<Locale | null>(null);

  /** Own locale, not a caller input: the hire-status label is this component's copy. */
  private readonly locale = inject(LandingLocaleService).locale;

  protected readonly statusLabel = computed(() =>
    resolveCopy(this.available() ? 'home.hero.status.available' : 'home.hero.status.busy', this.locale())
  );

  /** The `<section>` landmark reuses the pill-nav's own name for this region. */
  protected readonly sectionLabel = computed(() => resolveCopy('home.section.hero', this.locale()));
  protected readonly hireStatusLabel = computed(() => resolveCopy('home.hero.a11y.hireStatus', this.locale()));

  protected readonly contactLabel = computed(() => resolveCopy('home.hero.cta.contact', this.locale()));
  protected readonly resumeLabel = computed(() => {
    const fallback = this.resumeFallbackLocale();
    if (!fallback) return resolveCopy('home.hero.cta.resume', this.locale());
    return resolveCopy(fallback === 'en' ? 'home.hero.cta.resumeEnOnly' : 'home.hero.cta.resumeViOnly', this.locale());
  });

  /**
   * Splits the tagline at the first sentence boundary into two display blocks.
   * Line 1 (sans) — the first sentence ending in `.`, `?`, or `!`.
   * Line 2 (Newsreader italic accent) — everything after, joined.
   * Falls back to newline boundary if no sentence terminator is found.
   */
  private readonly taglineSplit = computed<readonly [string, string]>(() => {
    const raw = this.tagline().trim();
    if (!raw) return ['', ''];
    const match = raw.match(/^([^.!?]+[.!?])\s+([\s\S]+)$/);
    if (match) return [match[1].trim(), match[2].replace(/\s+/g, ' ').trim()];
    const lines = raw
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (lines.length > 1) return [lines[0], lines.slice(1).join(' ')];
    return [raw, ''];
  });

  protected readonly taglineLead = computed(() => this.taglineSplit()[0]);
  protected readonly taglineEmphasis = computed(() => this.taglineSplit()[1]);

  /**
   * Hero chip tokens. Prefers the Owner-authored `coreStackChips` array when present;
   * otherwise pulls the first paragraph of `stackIntro` and extracts its `**bold**` runs
   * (matching the §5 prose convention so the hero stays in sync without a duplicate field
   * round-trip). Final fallback: split the first paragraph by `· / , |`.
   */
  protected readonly coreStack = computed<readonly string[]>(() => {
    const authored = this.coreStackChips();
    if (authored && authored.length > 0) {
      return authored.map((s) => s.trim().toUpperCase()).filter((s) => s.length > 0);
    }

    const raw = this.stackIntro().trim();
    if (!raw) return [];
    const firstPara = raw.split(/\n\s*\n/, 1)[0] ?? '';
    const bolds = [...firstPara.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].trim());
    if (bolds.length > 0) return bolds.map((s) => s.toUpperCase());

    return firstPara
      .replace(/[*_`]/g, '')
      .split(/[·/,|]+/)
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0);
  });

  /** Join tokens with ` / `, but keep each multi-word token non-breaking so a
   *  wrap lands on a separator — never mid-token (e.g. "ANGULAR MATERIAL" stayed
   *  whole instead of breaking to read like a duplicate "ANGULAR"). */
  protected readonly stackDisplay = computed(() =>
    this.coreStack()
      .map((token) => token.replace(/ /g, ' '))
      .join(' / ')
  );
}
