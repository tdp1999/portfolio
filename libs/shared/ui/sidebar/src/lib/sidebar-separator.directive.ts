import { Directive } from '@angular/core';

@Directive({
  selector: '[uiSidebarSeparator]',
  standalone: true,
  host: {
    class: 'block w-full my-2 border-t border-border',
    'aria-hidden': 'true',
  },
})
export class SidebarSeparatorDirective {}
