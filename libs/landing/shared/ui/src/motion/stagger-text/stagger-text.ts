import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PSEUDO_RANDOM_OFFSETS } from './stagger-text.constants';

/**
 * Per-character entrance animation, rendered server-side. The template emits one
 * `<span>` per character with CSS variables `--fx-i` (index) and `--fx-y` (random
 * Y offset); CSS keyframes drive the fade-up + stagger.
 *
 * SSR-first by design — the spans live in the initial HTML, so the animation
 * runs from first paint on any network speed without waiting for hydration.
 * Earlier directive-based implementation needed JS to split the text node and
 * caused a "missing title until JS arrives" window on slow networks.
 *
 * Accessibility: chars are marked `aria-hidden`; the host carries the readable
 * label so screen readers announce the full word, not letter-by-letter.
 */
@Component({
  selector: 'landing-stagger-text',
  standalone: true,
  template: `@for (char of chars(); track $index) {
    <span
      class="fx-stagger-text__char"
      aria-hidden="true"
      [style.--fx-i]="$index"
      [style.--fx-y]="offsets[$index % offsets.length]"
      [style.animation-delay.ms]="$index * charDelay()"
      [style.animation-duration.ms]="duration()"
      >{{ char === ' ' ? ' ' : char }}</span
    >
  }`,
  styleUrl: './stagger-text.scss',
  host: { '[attr.aria-label]': 'text()', role: 'text' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaggerText {
  readonly text = input.required<string>();
  /** Delay between consecutive characters, in ms. */
  readonly charDelay = input<number>(22);
  /** Animation duration per character, in ms. */
  readonly duration = input<number>(520);

  protected readonly chars = computed(() => [...this.text()]);
  protected readonly offsets = PSEUDO_RANDOM_OFFSETS;
}
