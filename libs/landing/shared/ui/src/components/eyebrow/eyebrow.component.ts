import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type EyebrowInput = string | readonly string[];

@Component({
  selector: 'landing-eyebrow',
  standalone: true,
  template: `
    <span
      class="landing-eyebrow"
      [class.landing-eyebrow--accent-first]="accentFirst()"
      [class.landing-eyebrow--with-rule]="trailingRule()"
    >
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
  styleUrl: './eyebrow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EyebrowComponent {
  readonly label = input<EyebrowInput>([]);
  /** First part rendered in accent color, remaining parts in text-400. Used for section-header eyebrows. */
  readonly accentFirst = input<boolean>(false);
  /** Append a 1px hairline that flexes to fill the row. Forces the eyebrow into block-flex layout. */
  readonly trailingRule = input<boolean>(false);

  protected readonly parts = computed<readonly string[]>(() => {
    const value = this.label();
    if (typeof value === 'string') return value ? [value] : [];
    return value;
  });
}
