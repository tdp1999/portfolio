import { Component, DestroyRef, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';

import { SIDEBAR_CONTEXT } from './sidebar-context.token';
import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-provider',
  standalone: true,
  template: `<ng-content />`,
  providers: [SidebarState, { provide: SIDEBAR_CONTEXT, useExisting: SidebarState }],
  host: {
    class: 'flex h-full w-full',
    '[style.--console-sidebar-width]': 'sidebarWidth()',
  },
})
export class SidebarProviderComponent implements OnInit {
  private readonly state = inject(SidebarState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly sidebarWidth = computed(() => {
    if (this.state.isMobile() || !this.state.isOpen()) return '0px';
    return this.state.isCompact() ? '64px' : '240px';
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        filter((e) => (e.metaKey || e.ctrlKey) && e.key === 'b'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        e.preventDefault();
        this.state.toggle();
      });
  }
}
