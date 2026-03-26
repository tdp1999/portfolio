import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLinkActive } from '@angular/router';

import { SidebarState } from './sidebar-state.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[ui-sidebar-menu-button],button[ui-sidebar-menu-button]',
  standalone: true,
  template: `
    <ng-content select="[data-sidebar-icon]" />
    @if (!state.isCompact()) {
      <ng-content />
    }
  `,
  host: {
    class:
      'sidebar-menu-button flex w-full cursor-pointer rounded-md text-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    '[class.active]': 'active()',
    '[class.font-semibold]': 'active()',
    '[class.items-center]': 'true',
    '[class.justify-center]': 'state.isCompact()',
    '[class.gap-3]': '!state.isCompact()',
    '[class.p-3]': 'state.isCompact()',
    '[class.px-3]': '!state.isCompact()',
    '[class.py-1.5]': '!state.isCompact() && size() === "sm"',
    '[class.py-2.5]': '!state.isCompact() && (size() === "default" || isLarge())',
    '[class.text-base]': 'isLarge()',
    '[attr.title]': 'tooltipText()',
    role: 'menuitem',
  },
  styles: [
    `
      :host {
        color: var(--color-text-secondary);
        transition:
          background 0.2s ease,
          color 0.2s ease,
          box-shadow 0.2s ease;
      }
      :host(:hover:not(.active)) {
        background: var(--color-surface-hover);
        color: var(--color-text);
      }
      :host(.active) {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
        box-shadow:
          0 0 0 1px rgba(99, 102, 241, 0.1),
          0 0 20px -5px rgba(99, 102, 241, 0.15);
        color: var(--color-text);
      }
    `,
  ],
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
