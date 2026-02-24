import { Component } from '@angular/core';

@Component({
  selector: 'ui-sidebar-header',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'flex flex-col gap-4 p-2 shrink-0' },
})
export class SidebarHeaderComponent {}
