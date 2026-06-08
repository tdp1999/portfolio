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
 * The Loader — the "loading sting", duration-adaptive. Two phases:
 *   1. **Entrance** (~1.5s): the mark is revealed by `mode` — `draw` (per-glyph
 *      trace→ink, staggered left-to-right via a `--i` delay so the fill chases the
 *      pen), `drop` (glyphs rise + fade, the Dot drops in), or `wipe` (left-to-right
 *      reveal). The accent Dot lands just after the final glyph.
 *   2. **Loop** (until `done`): the Dot pulses ("still working") so the loader fits
 *      any load duration (3s / 5s / 10s …). When the consumer flips `[done]` true the
 *      pulse settles to a solid Dot; the consumer then hides/fades the loader.
 *
 * `mark` picks the Monogram (`tdp.`) or the Wordmark (`Phuong Tran.`) — both close with
 * the Dot. Reduce-motion → static filled state (no entrance, no loop). `replay()` re-runs
 * the entrance.
 */
@Component({
  selector: 'brand-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[class.mode-draw]': "mode() === 'draw'",
    '[class.mode-drop]': "mode() === 'drop'",
    '[class.mode-wipe]': "mode() === 'wipe'",
    '[class.is-done]': 'done()',
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
  /**
   * Entrance style: `draw` (per-glyph trace→ink, the signature sting), `drop`
   * (glyphs rise + fade, the Dot drops in), or `wipe` (left-to-right reveal).
   */
  readonly mode = input<'draw' | 'drop' | 'wipe'>('draw');
  /** Loading finished — stops the "still working" pulse and settles the Dot solid. */
  readonly done = input<boolean>(false);

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
