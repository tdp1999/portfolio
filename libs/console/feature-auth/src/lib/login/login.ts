import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ErrorDataService, FormErrorPipe } from '@portfolio/console/shared/util';
import { ToastService } from '@portfolio/console/shared/ui';
import { AuthErrorCode } from '@portfolio/shared/errors';
import { GOOGLE_ERROR_MESSAGES } from './login.data';

@Component({
  selector: 'console-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormErrorPipe,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorDataService = inject(ErrorDataService);

  // ── Writable signals ──────────────────────────────────────────────
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly remainingAttempts = signal<number | null>(null);
  readonly retryAfterSeconds = signal<number | null>(null);

  // ── Forms ─────────────────────────────────────────────────────────
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rememberMe: new FormControl(true, { nonNullable: true }),
  });

  // ── Plain state ───────────────────────────────────────────────────
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const err = this.errorDataService.lastError();
      if (!err) return;

      if (err.errorCode === AuthErrorCode.ACCOUNT_LOCKED || err.errorCode === AuthErrorCode.INVALID_CREDENTIALS) {
        const data = err.data as { remainingAttempts?: number; retryAfterSeconds?: number } | undefined;
        if (data?.remainingAttempts != null) this.remainingAttempts.set(data.remainingAttempts);
        if (data?.retryAfterSeconds != null) {
          this.retryAfterSeconds.set(data.retryAfterSeconds);
          this.startCountdown();
        }
      }
    });
  }

  ngOnInit(): void {
    this.errorDataService.clear();
    this.handleOAuthError();
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.remainingAttempts.set(null);
    this.retryAfterSeconds.set(null);
    this.clearCountdown();
    this.errorDataService.clear();

    const { email, password, rememberMe } = this.form.getRawValue();

    this.authStore.login(email, password, rememberMe).subscribe({
      next: () => {
        this.toast.success('Signed in successfully');
        const returnUrl = this.validateRedirectUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.submitting.set(false);
        // Known errors are handled by global handler + effect above
      },
    });
  }

  private validateRedirectUrl(url: string | null): string {
    if (!url) return '/';
    if (url.includes('://')) return '/';
    if (!url.startsWith('/')) return '/';
    return url;
  }

  loginWithGoogle(): void {
    this.authStore.loginWithGoogle();
  }

  // ── Private helpers ───────────────────────────────────────────────
  private handleOAuthError(): void {
    const errorCode = this.route.snapshot.queryParamMap.get('error');
    if (!errorCode) return;

    const message = GOOGLE_ERROR_MESSAGES[errorCode] ?? 'Authentication failed. Please try again.';
    this.toast.error(message);

    // Clean the URL so the error doesn't persist on refresh
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      const current = this.retryAfterSeconds();
      if (current != null && current > 1) {
        this.retryAfterSeconds.set(current - 1);
      } else {
        this.retryAfterSeconds.set(null);
        this.remainingAttempts.set(null);
        this.clearCountdown();
      }
    }, 1000);
    this.destroyRef.onDestroy(() => this.clearCountdown());
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
