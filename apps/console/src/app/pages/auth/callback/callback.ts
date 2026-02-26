import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';

@Component({
  selector: 'console-callback',
  standalone: true,
  template: `<div class="callback-spinner">
    <div class="spinner"></div>
    <p>Signing you in…</p>
  </div>`,
  styles: `
    .callback-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    p {
      color: #6b7280;
      font-size: 0.875rem;
    }
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
