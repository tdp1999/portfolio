import { Component, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-header',
  standalone: true,
  template: `
    <ng-content select="[data-sidebar-icon]" />
    @if (!state.isCompact()) {
      <ng-content />
    }
  `,
  host: {
    class: 'flex items-center gap-4 p-2 shrink-0',
  },
})
export class SidebarHeaderComponent {
  protected readonly state = inject(SidebarState);
}
