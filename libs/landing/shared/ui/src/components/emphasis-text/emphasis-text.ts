import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { parseEmphasis } from './emphasis-text.util';

@Component({
  selector: 'landing-emphasis-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Interpolations must sit flush against the control-flow braces: Angular's
  // default whitespace handling normalizes newlines/indentation around a text
  // interpolation into a single space, which would inject a stray gap before
  // punctuation segments (e.g. "projects ." instead of "projects."). Keeping the
  // @else branch on one line with no surrounding whitespace avoids that.
  template: `@for (s of segments(); track $index) {
    @if (s.em) {
      <em>{{ s.text }}</em>
    } @else {
      <ng-container>{{ s.text }}</ng-container>
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
