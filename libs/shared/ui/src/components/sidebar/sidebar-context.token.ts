import { InjectionToken, Signal } from '@angular/core';

export interface SidebarContext {
  readonly isCompact: Signal<boolean>;
  readonly isOpen: Signal<boolean>;
  readonly isMobile: Signal<boolean>;
}

export const SIDEBAR_CONTEXT = new InjectionToken<SidebarContext>('SidebarContext');
