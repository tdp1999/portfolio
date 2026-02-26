import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';

@Component({
  selector: 'console-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex h-dvh flex-col items-center justify-center gap-4">
      <mat-spinner diameter="40"></mat-spinner>
      <p class="text-sm text-text-muted">Signing you in…</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CallbackComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const token = this.extractToken();

    if (!token) {
      this.toast.error('Authentication failed — no token received');
      this.router.navigateByUrl('/auth/login');
      return;
    }

    // Clear the fragment immediately so token is not visible in URL
    window.history.replaceState({}, '', '/auth/callback');

    this.authStore.setAccessToken(token);
    this.authStore
      .fetchCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/');
        },
        error: () => {
          this.toast.error('Authentication failed — could not load user');
          this.router.navigateByUrl('/auth/login');
        },
      });
  }

  private extractToken(): string | null {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    return params.get('token');
  }
}
