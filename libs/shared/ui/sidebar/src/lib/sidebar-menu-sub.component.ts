import { Component, inject, signal } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-menu-sub',
  standalone: true,
  template: `
    @if (!state.isCompact()) {
      <div
        class="grid transition-[grid-template-rows,opacity] duration-200 ease-in-out"
        [style.grid-template-rows]="expanded() ? '1fr' : '0fr'"
        [style.opacity]="expanded() ? '1' : '0'"
      >
        <ul
          class="flex min-w-0 min-h-0 flex-col gap-1 border-l border-border px-2.5 overflow-hidden"
          role="menu"
        >
          <ng-content />
        </ul>
      </div>
    }
  `,
  host: { class: 'block' },
})
export class SidebarMenuSubComponent {
  protected readonly state = inject(SidebarState);

  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  open(): void {
    this.expanded.set(true);
  }

  close(): void {
    this.expanded.set(false);
  }
}
