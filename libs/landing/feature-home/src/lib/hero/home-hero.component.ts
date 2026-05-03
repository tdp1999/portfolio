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
   * Splits the Owner-authored `stackIntro` markdown into 3-ish core-stack tokens.
   * Accepts `·`, `/`, `,`, `|` or whitespace as separators; uppercases each item.
   */
  protected readonly coreStack = computed<readonly string[]>(() => {
    const raw = this.stackIntro().trim();
    if (!raw) return [];
    return raw
      .replace(/[*_`]/g, '')
      .split(/[·/,|\n]+/)
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0);
  });

  protected readonly stackDisplay = computed(() => this.coreStack().join(' / '));
}
