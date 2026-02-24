import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';

import { SidebarVariant } from './sidebar.type';

@Injectable()
export class SidebarState {
  private readonly breakpointObserver = inject(BreakpointObserverService);
  private readonly breakpoint = this.breakpointObserver.observe();

  readonly open = signal(true);
  readonly variant = signal<SidebarVariant>('expanded');
  readonly isMobile = computed(() => this.breakpoint().name === 'mobile');

  readonly isCompact = computed(() => this.variant() === 'icon');
  readonly isOpen = computed(() => this.open());

  constructor() {
    effect(() => {
      if (this.isMobile()) {
        this.open.set(false);
      }
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  setVariant(variant: SidebarVariant): void {
    this.variant.set(variant);
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }
}
