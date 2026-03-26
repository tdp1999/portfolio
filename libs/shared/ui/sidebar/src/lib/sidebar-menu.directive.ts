import { Directive } from '@angular/core';

@Directive({
  selector: 'ul[uiSidebarMenu]',
  standalone: true,
  host: {
    class: 'sidebar-menu space-y-1',
    role: 'menu',
  },
})
export class SidebarMenuDirective {}
