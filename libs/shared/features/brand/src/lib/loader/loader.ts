import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  DOT,
  MONOGRAM_GLYPHS,
  MONOGRAM_VIEWBOX,
  WORDMARK_DOT,
  WORDMARK_GLYPHS,
  WORDMARK_VIEWBOX,
} from '../glyph-outlines.data';

/**
 * The Loader — the v1 "loading sting". Each glyph is its own path that traces
 * (stroke-dashoffset) then inks (fill in / stroke out) in its own slot, staggered
 * left-to-right via a per-glyph `--i` delay, so the fill chases the pen as the name
 * is written, then the accent Dot pops just after the final glyph. `mark` picks the
 * Monogram (`tdp.`) or the Wordmark (`Phuong Tran.`) — both close with the Dot.
 * Reduce-motion → static filled state. Call `replay()` to re-run.
 */
@Component({
  selector: 'brand-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[style.--brand-accent]': 'accent()',
  },
  template: `
    @for (run of [runId()]; track run) {
      <svg class="draw" [attr.viewBox]="viewBox()" fill="none" aria-hidden="true">
        @for (d of glyphs(); track $index) {
          <path [attr.d]="d" pathLength="1" [style.--i]="$index" />
        }
        <circle
          class="draw-dot"
          [attr.cx]="dot().cx"
          [attr.cy]="dot().cy"
          [attr.r]="dot().r"
          [style.--dot-delay.s]="dotDelay()"
        />
      </svg>
    }
  `,
  styleUrl: './loader.scss',
})
export class Loader {
  readonly mark = input<'monogram' | 'wordmark'>('monogram');
  readonly accent = input<string | null>(null);
  readonly label = input<string>('tdp.');

  private readonly run = signal(0);
  protected readonly runId = this.run.asReadonly();

  protected readonly glyphs = computed(() => (this.mark() === 'wordmark' ? WORDMARK_GLYPHS : MONOGRAM_GLYPHS));
  protected readonly viewBox = computed(() => (this.mark() === 'wordmark' ? WORDMARK_VIEWBOX : MONOGRAM_VIEWBOX));
  protected readonly dot = computed(() => (this.mark() === 'wordmark' ? WORDMARK_DOT : DOT));
  /** Pop the Dot just after the last glyph finishes inking (stagger = count × 0.12s + slot). */
  protected readonly dotDelay = computed(() => Math.round((this.glyphs().length * 0.12 + 0.45) * 100) / 100);

  /** Re-run the draw (re-creates the svg, restarting the CSS animation). */
  replay(): void {
    this.run.update((n) => n + 1);
  }
}
