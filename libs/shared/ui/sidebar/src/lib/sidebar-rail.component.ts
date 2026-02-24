import { Component, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-rail',
  standalone: true,
  template: `
    <button
      type="button"
      class="absolute top-0 -right-2.5 z-10 h-full w-5 cursor-col-resize border-0 bg-transparent group"
      (click)="state.toggle()"
      aria-label="Toggle sidebar"
    >
      <span
        class="absolute left-1/2 -translate-x-1/2 top-0 h-full w-px bg-transparent transition-all duration-150 group-hover:w-1 group-hover:bg-border"
      ></span>
    </button>
  `,
  host: { class: 'contents' },
})
export class SidebarRailComponent {
  protected readonly state = inject(SidebarState);
}
