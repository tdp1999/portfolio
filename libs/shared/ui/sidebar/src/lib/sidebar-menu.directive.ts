import { Directive } from '@angular/core';

@Directive({
  selector: 'ul[uiSidebarMenu]',
  standalone: true,
  host: {
    class: 'sidebar-menu',
    role: 'menu',
  },
})
export class SidebarMenuDirective {}
