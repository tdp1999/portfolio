import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WORDMARK_DOT, WORDMARK_GLYPHS, WORDMARK_VIEWBOX } from '../glyph-outlines.data';
import type { BrandVariant } from '../brand.types';

/**
 * The Wordmark — `Phuong Tran.`, the Brand's secondary mark. Filled Newsreader-500
 * outlines (ink = `currentColor`) plus the accent Dot — the same atom that closes the
 * Monogram (`tdp.`), tying the two marks together. Scales with `font-size` (svg height
 * = 1em). `variant` controls Dot colour (full = accent; mono/knockout = ink); `accent`
 * overrides `--brand-accent` per instance/product.
 */
@Component({
  selector: 'brand-wordmark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class.mono]': "variant() === 'mono'",
    '[class.knockout]': "variant() === 'knockout'",
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
  styleUrl: './wordmark.scss',
})
export class Wordmark {
  readonly variant = input<BrandVariant>('full');
  readonly accent = input<string | null>(null);
  readonly label = input<string>('Phuong Tran.');

  protected readonly glyphs = WORDMARK_GLYPHS;
  protected readonly dot = WORDMARK_DOT;
  protected readonly viewBox = WORDMARK_VIEWBOX;
}
