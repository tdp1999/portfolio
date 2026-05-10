import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ContainerComponent, StatusDotComponent, LandingBackgroundComponent } from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-home-hero',
  standalone: true,
  imports: [ContainerComponent, StatusDotComponent, LandingBackgroundComponent],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroComponent {
  readonly fullName = input<string>('');
  readonly title = input<string>('');
  readonly tagline = input<string>('');
  readonly city = input<string>('');
  readonly available = input<boolean>(false);
  readonly stackIntro = input<string>('');
  /** Authored hero chips (3–4 short tokens). Falls back to tokenizing `stackIntro` when empty. */
  readonly coreStackChips = input<readonly string[]>([]);

  protected readonly statusLabel = computed(() => (this.available() ? 'AVAILABLE_FOR_HIRE' : 'BUSY'));

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

  protected readonly stackDisplay = computed(() => this.coreStack().join(' / '));
}
