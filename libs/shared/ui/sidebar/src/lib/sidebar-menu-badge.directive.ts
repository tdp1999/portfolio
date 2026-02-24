import { Directive, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Directive({
  selector: '[uiSidebarMenuBadge]',
  standalone: true,
  host: {
    class:
      'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md text-xs font-medium leading-none',
    '[class.hidden]': 'state.isCompact()',
  },
})
export class SidebarMenuBadgeDirective {
  protected readonly state = inject(SidebarState);
}
