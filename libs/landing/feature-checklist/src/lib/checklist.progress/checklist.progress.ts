import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ChecklistProgress as Progress } from '@portfolio/shared/types';

/** Complete over total as a hairline bar plus the count. Skipped tasks count as complete. */
@Component({
  selector: 'landing-checklist-progress',
  template: `
    <span class="progress__bar" aria-hidden="true">
      <span class="progress__fill" [style.width.%]="percent()"></span>
    </span>
    @if (showCount()) {
      <span class="progress__count">{{ progress().complete }}/{{ progress().total }}</span>
    }
  `,
  styleUrl: './checklist.progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'progress().total',
    '[attr.aria-valuenow]': 'progress().complete',
    '[attr.aria-label]': 'label()',
    '[class.progress--complete]': 'progress().total > 0 && progress().complete === progress().total',
  },
})
export class ChecklistProgress {
  readonly progress = input.required<Progress>();
  readonly label = input('Progress');
  readonly showCount = input(true);

  protected readonly percent = computed(() => {
    const { complete, total } = this.progress();
    return total === 0 ? 0 : (complete / total) * 100;
  });
}
