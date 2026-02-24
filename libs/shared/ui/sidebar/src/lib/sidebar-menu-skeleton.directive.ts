import { Directive } from '@angular/core';

@Directive({
  selector: '[uiSidebarMenuSkeleton]',
  standalone: true,
  host: {
    class:
      'flex h-8 items-center gap-2 rounded-md px-2 bg-surface-elevated opacity-50 animate-pulse',
    '[style.width]': 'skeletonWidth',
  },
})
export class SidebarMenuSkeletonDirective {
  readonly skeletonWidth = `${Math.floor(Math.random() * 40) + 50}%`;
}
