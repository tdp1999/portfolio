import { Directive } from '@angular/core';

@Directive({
  selector: 'li[uiSidebarMenuItem]',
  standalone: true,
  host: {
    class: 'sidebar-menu-item',
    role: 'menuitem',
  },
})
export class SidebarMenuItemDirective {}
