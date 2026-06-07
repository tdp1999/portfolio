import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LandingChipSize = 'sm' | 'md' | 'lg';
export type LandingChipProminence = 'default' | 'strong' | 'strongest';

@Component({
  selector: 'landing-chip',
  standalone: true,
  template: `
    <span [class]="chipClasses()">
      @if (iconUrl()) {
        <img class="landing-chip__icon" [src]="iconUrl()" alt="" loading="lazy" decoding="async" />
      }
      <span class="landing-chip__label">{{ label() }}</span>
    </span>
  `,
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chip {
  readonly label = input<string>('');
  readonly size = input<LandingChipSize>('md');
  /**
   * Visual weight relative to neighboring chips. Used on home Stack to encode tier
   * (DAILY → strongest, FREQUENT → strong, SHIPPED → default).
   */
  readonly prominence = input<LandingChipProminence>('default');
  /**
   * Optional icon source — typically a single-color SVG URL (Iconify, simple-icons CDN, or
   * Cloudinary-hosted custom upload). Rendered as a plain <img>, so the icon keeps its source
   * colors (brand-color usage). For monocolor/inherit behaviour, host a `currentColor` SVG and
   * use CSS `mask-image` instead — out of scope for this input.
   */
  readonly iconUrl = input<string | null | undefined>(null);

  protected readonly chipClasses = computed(() => {
    const classes = ['landing-chip', `landing-chip--${this.size()}`, `landing-chip--${this.prominence()}`];
    if (this.iconUrl()) classes.push('landing-chip--with-icon');
    return classes.join(' ');
  });
}
