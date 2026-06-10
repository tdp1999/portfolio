import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { EyebrowInput, EyebrowTone } from './eyebrow.types';

@Component({
  selector: 'landing-eyebrow',
  standalone: true,
  template: `
    <span
      class="landing-eyebrow"
      [class.landing-eyebrow--accent]="tone() === 'accent'"
      [class.landing-eyebrow--accent-first]="accentFirst()"
      [class.landing-eyebrow--with-rule]="trailingRule()"
      [class.landing-eyebrow--with-leading-rule]="leadingRule()"
    >
      @if (leadingRule()) {
        <span class="landing-eyebrow__rule landing-eyebrow__rule--leading" aria-hidden="true"></span>
      }
      @for (part of parts(); track $index; let last = $last) {
        <span class="landing-eyebrow__part">{{ part }}</span>
        @if (!last) {
          <span class="landing-eyebrow__sep" aria-hidden="true">·</span>
        }
      }
      <ng-content />
      @if (trailingRule()) {
        <span class="landing-eyebrow__rule" aria-hidden="true"></span>
      }
    </span>
  `,
  styleUrl: './eyebrow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Eyebrow {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly label = input<EyebrowInput>([]);
  /** Overall color tone. `accent` paints every part in indigo (use for section-block labels). */
  readonly tone = input<EyebrowTone>('default');
  /** First part rendered in accent color, remaining parts in text-400. Used for section-header eyebrows. */
  readonly accentFirst = input<boolean>(false);
  /** Append a 1px hairline that flexes to fill the row. Forces the eyebrow into block-flex layout. */
  readonly trailingRule = input<boolean>(false);
  /** Prepend a short fixed-width hairline before the label (editorial accent). */
  readonly leadingRule = input<boolean>(false);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly parts = computed<readonly string[]>(() => {
    const value = this.label();
    if (typeof value === 'string') return value ? [value] : [];
    return value;
  });
}

export type { EyebrowInput, EyebrowTone } from './eyebrow.types';
