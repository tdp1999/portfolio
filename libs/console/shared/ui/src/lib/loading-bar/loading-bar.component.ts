import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';

const MIN_DISPLAY_MS = 250;

@Component({
  selector: 'console-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    <div
      class="fixed top-0 left-0 z-[9999] w-full transition-opacity duration-200"
      [class.opacity-0]="!visible()"
      [class.opacity-100]="visible()"
    >
      <mat-progress-bar mode="indeterminate" />
    </div>
  `,
})
export class LoadingBarComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly visible = signal(false);

  private showTime = 0;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.hide();
      }
    });
  }

  private show(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTime = Date.now();
    this.loading.set(true);
    this.visible.set(true);
  }

  private hide(): void {
    const elapsed = Date.now() - this.showTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    this.hideTimeout = setTimeout(() => {
      this.visible.set(false);
      setTimeout(() => this.loading.set(false), 200);
      this.hideTimeout = null;
    }, remaining);
  }
}
