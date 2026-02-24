import { Component, computed, effect, inject, input } from '@angular/core';

import { SidebarState } from './sidebar-state.service';
import { SidebarVariant } from './sidebar.type';

@Component({
  selector: 'ui-sidebar',
  standalone: true,
  template: `
    @if (state.isMobile() && state.isOpen()) {
      <!-- Overlay backdrop - not interactive content, click dismisses modal -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div
        class="fixed inset-0 z-30 bg-black/50 transition-opacity duration-200"
        (click)="state.setOpen(false)"
      ></div>
    }
    <aside
      class="relative h-full overflow-hidden bg-surface text-text transition-[width,transform] duration-200 ease-in-out"
      [class.border-r]="state.isOpen() || state.isMobile()"
      [class.border-border]="state.isOpen() || state.isMobile()"
      [class.fixed]="state.isMobile()"
      [class.top-0]="state.isMobile()"
      [class.left-0]="state.isMobile()"
      [class.z-40]="state.isMobile()"
      [class.h-dvh]="state.isMobile()"
      [class.shadow-xl]="state.isMobile() && state.isOpen()"
      [style.width]="mobileWidth()"
      [style.transform]="mobileTransform()"
    >
      <div class="flex h-full flex-col overflow-hidden">
        <ng-content select="ui-sidebar-header" />
        <ng-content select="ui-sidebar-content" />
        <ng-content select="ui-sidebar-footer" />
      </div>
      <ng-content />
    </aside>
  `,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class SidebarComponent {
  protected readonly state = inject(SidebarState);

  readonly variant = input<SidebarVariant>('expanded');
  readonly expandedWidth = input('280px');
  readonly compactWidth = input('64px');

  protected readonly mobileWidth = computed(() => {
    if (this.state.isMobile()) return this.expandedWidth();
    if (!this.state.isOpen()) return '0px';
    return this.state.isCompact() ? this.compactWidth() : this.expandedWidth();
  });

  protected readonly mobileTransform = computed(() => {
    if (this.state.isMobile() && !this.state.isOpen()) return 'translateX(-100%)';
    return 'translateX(0)';
  });

  constructor() {
    effect(() => {
      this.state.setVariant(this.variant());
    });
  }

  protected onEscape(): void {
    if (this.state.isMobile() && this.state.isOpen()) {
      this.state.setOpen(false);
    }
  }
}
