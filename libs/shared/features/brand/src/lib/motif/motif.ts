import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MOTIF } from '../master.util';

/**
 * The decoration Motif — a lines-only blueprint grid (the locked Phase-3 motif).
 * A background layer: drop it inside any `position: relative` surface and it fills
 * it (absolute inset-0, `pointer-events: none`, `aria-hidden`). The Dot is
 * deliberately absent so the mark's accent Dot stays the only circle on the canvas.
 * `accent` drives the line colour (defaults to inherited `--brand-accent`);
 * `cell` / `strokeWidth` / `opacity` tune density. Web counterpart of `motifSvg()`
 * — all three default off the shared `MOTIF` token so the two render paths agree.
 */
@Component({
  selector: 'brand-motif',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.--brand-accent]': 'accent()',
    '[style.--motif-cell.px]': 'cell()',
    '[style.--motif-stroke.px]': 'strokeWidth()',
    '[style.--motif-opacity]': 'opacity()',
  },
  template: '',
  styleUrl: './motif.scss',
})
export class Motif {
  readonly accent = input<string | null>(null);
  readonly cell = input<number>(MOTIF.cell);
  readonly strokeWidth = input<number>(MOTIF.stroke);
  readonly opacity = input<number>(MOTIF.opacity);
}
