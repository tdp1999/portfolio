import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLinkActive } from '@angular/router';

import { SidebarState } from './sidebar-state.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[ui-sidebar-menu-sub-button],button[ui-sidebar-menu-sub-button]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class:
      'flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-text no-underline transition-colors duration-150 hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    '[class.bg-surface-elevated]': 'active()',
    '[class.font-medium]': 'active()',
    '[class.text-xs]': 'size() === "sm"',
    role: 'menuitem',
  },
})
export class SidebarMenuSubButtonComponent {
  protected readonly state = inject(SidebarState);

  readonly size = input<'sm' | 'default'>('default');
  readonly isActive = input(false);

  private readonly rla = inject(RouterLinkActive, { optional: true, self: true });

  private readonly rlaIsActive = this.rla
    ? toSignal(this.rla.isActiveChange, { initialValue: this.rla.isActive })
    : () => false;

  protected readonly active = computed(() => this.isActive() || this.rlaIsActive());
}
