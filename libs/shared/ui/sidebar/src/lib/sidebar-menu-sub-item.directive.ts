import { Directive } from '@angular/core';

@Directive({
  selector: 'li[uiSidebarMenuSubItem]',
  standalone: true,
  host: {
    class: 'relative',
    role: 'menuitem',
  },
})
export class SidebarMenuSubItemDirective {}
