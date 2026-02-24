import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLinkActive } from '@angular/router';

import { SidebarState } from './sidebar-state.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[ui-sidebar-menu-button],button[ui-sidebar-menu-button]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class:
      'flex w-full cursor-pointer rounded-md text-sm text-text no-underline transition-colors duration-150 hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    '[class.bg-surface-elevated]': 'active()',
    '[class.font-semibold]': 'active()',
    '[class.flex-col]': 'state.isCompact()',
    '[class.items-center]': 'true',
    '[class.justify-center]': 'state.isCompact()',
    '[class.text-center]': 'state.isCompact()',
    '[class.gap-1]': 'state.isCompact()',
    '[class.gap-2]': '!state.isCompact()',
    '[class.text-xs]': 'state.isCompact()',
    '[class.px-2]': '!isLarge()',
    '[class.py-1]': 'size() === "sm"',
    '[class.py-1.5]': 'size() === "default"',
    '[class.px-3]': 'isLarge()',
    '[class.py-2]': 'isLarge()',
    '[class.text-base]': 'isLarge()',
    '[attr.title]': 'tooltipText()',
    role: 'menuitem',
  },
})
export class SidebarMenuButtonComponent {
  protected readonly state = inject(SidebarState);

  readonly size = input<'sm' | 'default' | 'lg'>('default');
  readonly isActive = input(false);
  readonly tooltip = input('');

  private readonly rla = inject(RouterLinkActive, { optional: true, self: true });

  private readonly rlaIsActive = this.rla
    ? toSignal(this.rla.isActiveChange, { initialValue: this.rla.isActive })
    : () => false;

  protected readonly active = computed(() => this.isActive() || this.rlaIsActive());
  protected readonly isLarge = computed(() => this.size() === 'lg');

  protected readonly tooltipText = computed(() => {
    if (this.state.isCompact() && this.tooltip()) return this.tooltip();
    return null;
  });
}
