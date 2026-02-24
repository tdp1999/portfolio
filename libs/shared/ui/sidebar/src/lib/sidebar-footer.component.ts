import { Component, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-footer',
  standalone: true,
  template: `
    <ng-content select="[data-sidebar-icon]" />
    @if (!state.isCompact()) {
      <ng-content />
    }
  `,
  host: {
    class: 'flex gap-4 p-2 items-center shrink-0',
  },
})
export class SidebarFooterComponent {
  protected readonly state = inject(SidebarState);
}
