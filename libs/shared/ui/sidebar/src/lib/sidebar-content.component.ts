import { Component } from '@angular/core';

@Component({
  selector: 'ui-sidebar-content',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'flex flex-col flex-1 min-h-0 gap-2 overflow-y-auto p-2' },
})
export class SidebarContentComponent {}
