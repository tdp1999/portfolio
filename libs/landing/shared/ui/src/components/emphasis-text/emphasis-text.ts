import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { parseEmphasis } from './emphasis-text.util';

@Component({
  selector: 'landing-emphasis-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (s of segments(); track $index) {
    @if (s.em) {
      <em>{{ s.text }}</em>
    } @else {
      {{ s.text }}
    }
  }`,
})
export class EmphasisText {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly text = input.required<string>();

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly segments = computed(() => parseEmphasis(this.text()));
}

export { parseEmphasis } from './emphasis-text.util';
