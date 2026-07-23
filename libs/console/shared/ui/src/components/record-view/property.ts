import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * One scalar attribute: label above, value below. Replaces `.detail-field` for
 * short values.
 *
 * `.detail-field` put a fixed 140px label beside the value and was applied to
 * everything, so a 400-word description inherited the layout of a slug. Keeping
 * this component for scalars only is what stops that from recurring — anything
 * long-form belongs in `console-record-field`.
 *
 * The caller renders the value, so a badge, a chip row, or a link list all fit
 * without new inputs.
 */
@Component({
  selector: 'console-property',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv-prop">
      <span class="rv-prop__label">{{ label() }}</span>
      <span class="rv-prop__value" [class.rv-prop__value--mono]="mono()"><ng-content /></span>
    </div>
  `,
})
export class Property {
  readonly label = input.required<string>();
  /** Monospace the value — ids, slugs, hashes. */
  readonly mono = input(false, { transform: booleanAttribute });
}
