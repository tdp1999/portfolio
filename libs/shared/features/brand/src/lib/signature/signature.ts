import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Monogram } from '../monogram/monogram';
import { Wordmark } from '../wordmark/wordmark';
import type { BrandVariant } from '../brand.types';

/**
 * The Signature — the locked lockup of Monogram + Wordmark, how the Brand reads in
 * a header / footer / email sign-off. `layout` switches horizontal vs stacked;
 * `variant`/`accent` pass through to both marks (each carries the accent Dot).
 */
@Component({
  selector: 'brand-signature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Monogram, Wordmark],
  host: {
    '[class.stacked]': "layout() === 'stacked'",
  },
  template: `
    <brand-monogram class="sig__mono" [variant]="variant()" [accent]="accent()" />
    <brand-wordmark class="sig__word" [variant]="variant()" [accent]="accent()" />
  `,
  styleUrl: './signature.scss',
})
export class Signature {
  readonly layout = input<'horizontal' | 'stacked'>('horizontal');
  readonly variant = input<BrandVariant>('full');
  readonly accent = input<string | null>(null);
}
