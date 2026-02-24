import { Component, DestroyRef, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-provider',
  standalone: true,
  template: `<ng-content />`,
  providers: [SidebarState],
  host: {
    class: 'flex h-full w-full',
  },
})
export class SidebarProviderComponent implements OnInit {
  private readonly state = inject(SidebarState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

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
