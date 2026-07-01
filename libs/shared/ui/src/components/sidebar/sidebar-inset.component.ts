import { Component } from '@angular/core';

@Component({
  selector: 'ui-sidebar-inset',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'flex flex-col flex-1 min-h-0 min-w-0',
  },
})
export class SidebarInsetComponent {}
