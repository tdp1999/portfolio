import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type EyebrowInput = string | readonly string[];

@Component({
  selector: 'landing-eyebrow',
  standalone: true,
  template: `
    <span class="landing-eyebrow">
      @for (part of parts(); track $index; let last = $last) {
        <span class="landing-eyebrow__part">{{ part }}</span>
        @if (!last) {
          <span class="landing-eyebrow__sep" aria-hidden="true">·</span>
        }
      }
      <ng-content />
    </span>
  `,
  styleUrl: './eyebrow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EyebrowComponent {
  readonly label = input<EyebrowInput>([]);

  protected readonly parts = computed<readonly string[]>(() => {
    const value = this.label();
    if (typeof value === 'string') return value ? [value] : [];
    return value;
  });
}
