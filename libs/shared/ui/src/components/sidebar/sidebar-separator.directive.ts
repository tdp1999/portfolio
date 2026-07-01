import { Directive, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Directive({
  selector: '[uiSidebarSeparator]',
  standalone: true,
  host: {
    class: 'block w-full my-2 border-t border-border',
    '[class.hidden]': 'state.isCompact()',
    'aria-hidden': 'true',
  },
})
export class SidebarSeparatorDirective {
  protected readonly state = inject(SidebarState);
}
