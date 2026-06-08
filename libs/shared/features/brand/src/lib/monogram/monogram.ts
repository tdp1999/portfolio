import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DOT, MONOGRAM_GLYPHS, MONOGRAM_VIEWBOX } from '../glyph-outlines.data';
import type { BrandVariant } from '../brand.types';

/**
 * The Monogram — `tdp.`, the Brand's primary mark. Filled Newsreader-500 outlines
 * (ink = `currentColor`) plus the accent Dot. Scales with `font-size` (svg height
 * = 1em) so it drops into headers/inline like a glyph; override width/font-size to
 * size it explicitly. `variant` controls colour: full = accent dot; mono/knockout
 * = single ink colour. `accent` overrides `--brand-accent` per instance/product.
 */
@Component({
  selector: 'brand-monogram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class.mono]': "variant() === 'mono'",
    '[class.knockout]': "variant() === 'knockout'",
    '[class.weight-breathe]': 'weightBreathe()',
    '[style.--brand-accent]': 'accent()',
  },
  template: `
    <svg [attr.viewBox]="viewBox" fill="none" aria-hidden="true">
      <g fill="currentColor">
        @for (d of glyphs; track $index) {
          <path [attr.d]="d" />
        }
      </g>
      <circle class="dot" [attr.cx]="dot.cx" [attr.cy]="dot.cy" [attr.r]="dot.r" />
    </svg>
  `,
  styleUrl: './monogram.scss',
})
export class Monogram {
  readonly variant = input<BrandVariant>('full');
  readonly accent = input<string | null>(null);
  readonly label = input<string>('tdp.');

  /** Faux variable-weight — animates a stroke on the outline so the mark "breathes" heavier/lighter. */
  readonly weightBreathe = input<boolean>(false);

  protected readonly glyphs = MONOGRAM_GLYPHS;
  protected readonly dot = DOT;
  protected readonly viewBox = MONOGRAM_VIEWBOX;
}
