import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LOADING_BAR_MIN_DISPLAY_MS as MIN_DISPLAY_MS } from '@portfolio/console/shared/util';
import { ProgressBarHandle, ProgressBarService } from './progress-bar.service';

@Component({
  selector: 'console-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    <div
      class="fixed top-0 left-0 z-[9999] w-full transition-opacity duration-200"
      [class.opacity-0]="!visible()"
      [class.opacity-100]="visible()"
      [attr.aria-hidden]="!visible()"
    >
      <mat-progress-bar mode="indeterminate" />
    </div>
  `,
})
export class LoadingBarComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(ProgressBarService);

  readonly visible = signal(false);

  private showTime = 0;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private routerHandle: ProgressBarHandle | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!this.routerHandle) this.routerHandle = this.progress.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.routerHandle?.complete();
        this.routerHandle = null;
      }
    });

    // React to active state from any source (router or manual)
    effect(() => {
      if (this.progress.active()) this.show();
      else this.hide();
    });
  }

  private show(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTime = Date.now();
    this.visible.set(true);
  }

  private hide(): void {
    const elapsed = Date.now() - this.showTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    this.hideTimeout = setTimeout(() => {
      this.visible.set(false);
      this.hideTimeout = null;
    }, remaining);
  }
}
