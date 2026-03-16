import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'console-filter-bar',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <ng-content />
    </div>
  `,
  host: { class: 'block mb-4' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {}
